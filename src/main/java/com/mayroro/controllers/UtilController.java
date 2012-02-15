package com.mayroro.controllers;

import java.io.IOException;
import java.net.URL;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.google.gdata.client.docs.DocsService;
import com.google.gdata.data.PlainTextConstruct;
import com.google.gdata.data.docs.SpreadsheetEntry;
import com.google.gdata.data.spreadsheet.WorksheetEntry;
import com.google.gdata.util.ServiceException;
import com.google.gson.Gson;
import com.google.visualization.datasource.datatable.DataTable;
import com.mayroro.util.ConstFunc;
import com.mayroro.util.UserInfo;

@Controller
@RequestMapping("/util")
public class UtilController {
	@RequestMapping("new_spreadsheet")
	public String newSpreadsheet(HttpServletRequest req, HttpServletResponse res, @RequestParam("title") String title){
		HttpSession session = req.getSession();
		UserInfo ui = (UserInfo)session.getAttribute("userInfo");
		
		DocsService service = new DocsService("mayRoro");
		service.setHeader("Authorization", "OAuth "+ui.getAccess_token());
		
		if(title == null)
			return "forward:/error?type=parameter_missing";
		
		try {
			SpreadsheetEntry spreadsheet = createNewSpreadsheet(service, ConstFunc.SPREADSHEET_PREFIX+title);
			return "redirect:/maut/"+spreadsheet.getDocId();
		} catch (Exception e) {
			e.printStackTrace();
			return "forward:/error?type=new_spreadsheet_error";
		}
	}
	
	@RequestMapping(value="/save")
	public @ResponseBody String save(@RequestParam("drevo") String drevo, @RequestParam("funkcije") String funkcije, @RequestParam("maut") String maut, HttpServletRequest req) {

		System.out.println("ATTRIBUTES:");
		System.out.println("drevo: "+ drevo + "\nFunkcije: " + funkcije + "\nMaut: " + maut);
		
		DataTable dataTable = jsonDataTable(drevo, DataTable.class);
		System.out.println("Cols: "+dataTable.getNumberOfColumns());
		System.out.println("Rows: "+dataTable.getNumberOfRows());
		
		return "ok";
	}
	
	private <T> T jsonDataTable(String json, Class<T> classOfT){
		Gson gson = new Gson();
		String converted = json.replaceFirst("cols", "columns");
		converted = converted.replaceAll("\"type\":\"string\"", "\"type\":\"TEXT\"");
		converted = converted.replaceAll("\"type\":\"number\"", "\"type\":\"NUMBER\"");
		return gson.fromJson(converted, classOfT);
	}
	
	private SpreadsheetEntry createNewSpreadsheet(DocsService service, String title) throws IOException, ServiceException {
		SpreadsheetEntry newEntry = new SpreadsheetEntry();
		newEntry.setTitle(new PlainTextConstruct(title));
		
		// Prevent collaborators from sharing the document with others?
		// newEntry.setWritersCanInvite(false);

		// You can also hide the document on creation
		// newEntry.setHidden(true);
		
		SpreadsheetEntry spreadsheet = service.insert(new URL("https://docs.google.com/feeds/default/private/full/"), newEntry);
		
		URL worksheetFeedUrl = spreadsheet.getWorksheetFeedUrl();
		
		// Worksheet - drevo
		createNewWorksheet(service, worksheetFeedUrl, "drevo", 100, 3);
		
		// Worksheet - funkcije
		createNewWorksheet(service, worksheetFeedUrl, "funkcije", 50, 60);

		// Worksheet - maut
		createNewWorksheet(service, worksheetFeedUrl, "maut", 101, 51);
		
		// Delete default worksheet
		WorksheetEntry worksheet = spreadsheet.getWorksheets().get(0);
		worksheet.delete();
		
		return spreadsheet;
	}
	
	private WorksheetEntry createNewWorksheet(DocsService service, URL worksheetFeedUrl, String title, int rowCount, int colCount) throws IOException, ServiceException{
		WorksheetEntry worksheet = new WorksheetEntry();
		worksheet.setTitle(new PlainTextConstruct(title));
		worksheet.setRowCount(rowCount);
		worksheet.setColCount(colCount);
		service.insert(worksheetFeedUrl, worksheet);
		return worksheet;
	}
	
//	private void createFolder(DocsService client, String title) throws IOException, ServiceException {
//		FolderEntry newEntry = new FolderEntry();
//		newEntry.setTitle(new PlainTextConstruct(title));
//		URL feedUrl = new URL("https://docs.google.com/feeds/default/private/full/");
//		client.insert(feedUrl, newEntry);
//	}
}