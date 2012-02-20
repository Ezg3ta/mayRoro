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
import com.google.gdata.client.spreadsheet.SpreadsheetService;
import com.google.gdata.data.PlainTextConstruct;
import com.google.gdata.data.docs.SpreadsheetEntry;
import com.google.gdata.data.spreadsheet.WorksheetEntry;
import com.google.gdata.data.spreadsheet.WorksheetFeed;
import com.google.gdata.util.ServiceException;
import com.google.gson.Gson;
import com.mayroro.util.ColumnDescription;
import com.mayroro.util.DataTable;
import com.mayroro.util.BatchCellUpdater;
import com.mayroro.util.ConstFunc;
import com.mayroro.util.TableCell;
import com.mayroro.util.TableRow;
import com.mayroro.util.UserInfo;
import com.mayroro.util.tree.*;

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
			Gson gson = new Gson();
			for (WorksheetEntry we : worksheetFeed.getEntries()){
				dt = new DataTable();
				if ("drevo".equals(we.getTitle().getPlainText())){
					dt = gson.fromJson(drevo, com.mayroro.util.DataTable.class);
					BatchCellUpdater.update(ssSvc, key, we.getId().substring(we.getId().length()-3, we.getId().length()), dt);
				}
				if ("maut".equals(we.getTitle().getPlainText())){
					dt = gson.fromJson(maut, com.mayroro.util.DataTable.class);
					BatchCellUpdater.update(ssSvc, key, we.getId().substring(we.getId().length()-3, we.getId().length()), dt);
				}
				if ("funkcije".equals(we.getTitle().getPlainText())){
					dt = gson.fromJson(funkcije, com.mayroro.util.DataTable.class);
					BatchCellUpdater.update(ssSvc, key, we.getId().substring(we.getId().length()-3, we.getId().length()), dt);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return "ok";
	}
	
	@RequestMapping(value="/result")
	public @ResponseBody String result(@RequestParam("drevo") String drevoJson, @RequestParam("funkcije") String funkcijeJson, @RequestParam("maut") String mautJson) {
		Gson gson = new Gson();
		
		DataTable dtDrevo = gson.fromJson(drevoJson, com.mayroro.util.DataTable.class);
		DataTable dtFunkcije = gson.fromJson(funkcijeJson, com.mayroro.util.DataTable.class);
		DataTable dtMaut = gson.fromJson(mautJson, com.mayroro.util.DataTable.class);
		
		dtDrevo.removeEmptyRows();
		
		Tree drevo = new Tree(dtDrevo);
		drevo.setMautFunction(dtFunkcije);
		
		DataTable output = new DataTable();
		ColumnDescription col = new ColumnDescription();
		col.setId("A");
		col.setLabel("alternativa");
		col.setPattern("");
		col.setType("TEXT");
		
		output.addCol(col);
		
		col = new ColumnDescription();
		col.setId("B");
		col.setLabel("ocena");
		col.setPattern("#,##0.###############");
		col.setType("NUMBER");
		
		output.addCol(col);
		
		TableRow newRow;
		TableCell newCell;
		for (int i = 1; i < dtMaut.getCols().size(); i++){
			drevo.setData(dtMaut, i);
			if (!drevo.isDataComplete()){
				System.out.println("CHECK DATA!");
				continue;
			}
			newRow = new TableRow();
			newRow.addCell(dtMaut.getCols().get(i).getLabel());
			newCell = new TableCell(Double.toString(drevo.calculateValue()));
			newCell.setF(newCell.getValue().replace('.', ','));
			newRow.addCell(newCell);
			output.addRow(newRow);
		}
		
		return gson.toJson(output);
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