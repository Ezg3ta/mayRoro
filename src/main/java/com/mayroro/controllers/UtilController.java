package com.mayroro.controllers;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.google.gdata.client.docs.DocsService;
import com.google.gdata.client.spreadsheet.SpreadsheetService;
import com.google.gdata.data.PlainTextConstruct;
import com.google.gdata.data.docs.SpreadsheetEntry;
import com.google.gdata.data.spreadsheet.WorksheetEntry;
import com.google.gdata.data.spreadsheet.WorksheetFeed;
import com.google.gdata.util.AuthenticationException;
import com.google.gdata.util.ServiceException;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.visualization.datasource.base.TypeMismatchException;
import com.google.visualization.datasource.datatable.DataTable;
import com.mayroro.util.BatchCellUpdater;
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
	public @ResponseBody String save(@RequestParam("drevo") String drevo, @RequestParam("funkcije") String funkcije, @RequestParam("maut") String maut, @RequestParam("key") String key, HttpServletRequest req) {

		System.out.println("ATTRIBUTES:");
		System.out.println("drevo: "+ drevo + "\nFunkcije: " + funkcije + "\nMaut: " + maut);
		
		HttpSession session = req.getSession();
		String accessToken = ((UserInfo)session.getAttribute("userInfo")).getAccess_token();
		System.out.println("ACCESS_TOKEN: "+accessToken);
		
		DocsService service = new DocsService("mayRoro");
		service.setHeader("Authorization", "OAuth "+accessToken);
		
		SpreadsheetService ssSvc = new SpreadsheetService("mayRoro");
		ssSvc.setHeader("Authorization", "OAuth "+accessToken);
		
		try {
			URL worksheetFeedUrl = new URL("https://spreadsheets.google.com/feeds/worksheets/"+key+"/private/full");
			WorksheetFeed worksheetFeed = service.getFeed(worksheetFeedUrl, WorksheetFeed.class);
			
			DataTable dt;
			for (WorksheetEntry we : worksheetFeed.getEntries()){
				System.out.println(we.getTitle()+": "+ we.getId().substring(we.getId().length()-3, we.getId().length()));
				if ("drevo".equals(we.getTitle().getPlainText())){
					dt = new Gson().fromJson(jsonDataTable(drevo), com.mayroro.util.DataTable.class).convert();
					BatchCellUpdater.update(ssSvc, key, we.getId().substring(we.getId().length()-3, we.getId().length()), dt.getRows());
				}
				if ("maut".equals(we.getTitle().getPlainText())){
					dt = new Gson().fromJson(jsonDataTable(maut), com.mayroro.util.DataTable.class).convert();
					BatchCellUpdater.update(ssSvc, key, we.getId().substring(we.getId().length()-3, we.getId().length()), dt.getRows());
				}
				if ("funkcije".equals(we.getTitle().getPlainText())){
					dt = new Gson().fromJson(jsonDataTable(funkcije), com.mayroro.util.DataTable.class).convert();
					BatchCellUpdater.update(ssSvc, key, we.getId().substring(we.getId().length()-3, we.getId().length()), dt.getRows());
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return "ok";
	}
	
	private static String jsonDataTable(String json){
		String converted = json.replaceFirst("cols", "columns");
		converted = converted.replaceAll("\"type\":\"string\"", "\"type\":\"TEXT\"");
		converted = converted.replaceAll("\"type\":\"number\"", "\"type\":\"NUMBER\"");
		converted = converted.replaceAll("\\{\"c\":\\[", "\\{\"cells\":\\[");
		converted = converted.replaceAll("\\{\"v\":", "\\{\"value\":");
		converted = converted.replaceAll("\"f\":", "\"formattedValue\":");
		return converted;
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