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
		
		SpreadsheetService ssSvc = new SpreadsheetService("mayRoro");
		ssSvc.setHeader("Authorization", "OAuth "+ui.getAccess_token());
		
		if(title == null)
			return "forward:/error?type=parameter_missing";
		
		try {
			SpreadsheetEntry spreadsheet = createNewSpreadsheet(service, ssSvc, ConstFunc.SPREADSHEET_PREFIX+title);
			return "redirect:/maut/"+spreadsheet.getDocId();
		} catch (Exception e) {
			e.printStackTrace();
			return "forward:/error?type=new_spreadsheet_error";
		}
	}
	
	@RequestMapping(value="/save")
	public @ResponseBody String save(@RequestParam("drevo") String drevo, @RequestParam("funkcije") String funkcije, @RequestParam("maut") String maut, @RequestParam("key") String key, HttpServletRequest req) {

		System.out.println("ATTRIBUTES:");
		System.out.println("Drevo: "+ drevo + "\nFunkcije: " + funkcije + "\nMaut: " + maut);
		
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
		drevo.cleanNames();
		drevo.setMautFunction(dtFunkcije);
		
		StringBuilder sb = new StringBuilder();
		String result;
		for (int i = 1; i < dtMaut.getCols().size(); i++){
			drevo.setData(dtMaut, i);
			if (!drevo.isDataComplete()){
				System.out.println("CHECK DATA!");
				continue;
			}
			sb.append("~");
			sb.append(dtMaut.getCols().get(i).getLabel());
			sb.append(";");
			
			result = Double.toString(drevo.calculateValue()).replace('.', ',');
			sb.append(result);
//			sb.append(drevo.calculateValue());
		}
		
		System.out.println(sb.toString());
		return sb.toString();
	}
	
	private SpreadsheetEntry createNewSpreadsheet(DocsService service, SpreadsheetService ssSvc, String title) throws IOException, ServiceException {
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
		createNewWorksheet(service, worksheetFeedUrl, "maut", 30, 51);
		
		// Delete default worksheet
		WorksheetEntry worksheet = spreadsheet.getWorksheets().get(0);
		worksheet.delete();
		
		// Fill worksheets
		BatchCellUpdater.update(ssSvc, spreadsheet.getDocId(), "od7", worksheetDrevo());
		BatchCellUpdater.update(ssSvc, spreadsheet.getDocId(), "od4", worksheetFunkcije());
		BatchCellUpdater.update(ssSvc, spreadsheet.getDocId(), "od5", worksheetMaut());
		
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
	
	private DataTable worksheetDrevo(){
		DataTable dtDrevo = new DataTable();
		
		ColumnDescription cd = new ColumnDescription();
		cd.setId("A");
		cd.setLabel("child");
		cd.setPattern("");
		cd.setType("TEXT");
		
		dtDrevo.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("B");
		cd.setLabel("parent");
		cd.setPattern("");
		cd.setType("TEXT");

		dtDrevo.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("C");
		cd.setLabel("");
		cd.setPattern("");
		cd.setType("NUMBER");

		dtDrevo.addCol(cd);
		
		TableRow tr = new TableRow();
		tr.addCell("<input type=\"text\" value=\"node 2\" nodeId=\"1\"/>");
		tr.addCell("<input type=\"text\" value=\"node 1\" nodeId=\"0\"/>");
		tr.addCell("0.5");
		dtDrevo.addRow(tr);
		
		tr = new TableRow();
		tr.addCell("<input type=\"text\" value=\"node 3\" nodeId=\"2\"/>");
		tr.addCell("<input type=\"text\" value=\"node 1\" nodeId=\"0\"/>");
		tr.addCell("0.5");
		dtDrevo.addRow(tr);
		
		tr = new TableRow();
		tr.addCell("<input type=\"text\" value=\"node 1\" nodeId=\"0\"/>");
		tr.addCell("");
		tr.addCell("");
		dtDrevo.addRow(tr);
		
		return dtDrevo;
	}
	
	private DataTable worksheetFunkcije(){
		DataTable dtFunkcije = new DataTable();
		
		ColumnDescription cd = new ColumnDescription();
		cd.setId("A");
		cd.setLabel("node 2");
		cd.setPattern("#,##0.###############");
		cd.setType("NUMBER");
		
		dtFunkcije.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("B");
		cd.setLabel("");
		cd.setPattern("#,##0.###############");
		cd.setType("NUMBER");

		dtFunkcije.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("C");
		cd.setLabel("node 3");
		cd.setPattern("#,##0.###############");
		cd.setType("NUMBER");

		dtFunkcije.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("D");
		cd.setLabel("");
		cd.setPattern("#,##0.###############");
		cd.setType("NUMBER");

		dtFunkcije.addCol(cd);
		
		TableRow tr = new TableRow();
		tr.addCell("0");
		tr.addCell("100");
		tr.addCell("0");
		tr.addCell("100");
		dtFunkcije.addRow(tr);
		
		for (int i = 1; i < 21; i++){
			tr = new TableRow();
			tr.addCell(Integer.toString(i));
			tr.addCell("0,5");
			tr.addCell(Integer.toString(i));
			tr.addCell("0,5");
			dtFunkcije.addRow(tr);
		}
		
		return dtFunkcije;
	}
	
	private DataTable worksheetMaut(){
		DataTable dtMaut = new DataTable();
		
		ColumnDescription cd = new ColumnDescription();
		cd.setId("A");
		cd.setLabel("atribut");
		cd.setPattern("");
		cd.setType("TEXT");
		
		dtMaut.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("B");
		cd.setLabel("alternativa 1");
		cd.setPattern("");
		cd.setType("TEXT");

		dtMaut.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("C");
		cd.setLabel("alternativa 2");
		cd.setPattern("");
		cd.setType("TEXT");

		dtMaut.addCol(cd);
		
		cd = new ColumnDescription();
		cd.setId("D");
		cd.setLabel("alternativa 3");
		cd.setPattern("");
		cd.setType("TEXT");

		dtMaut.addCol(cd);
		
		TableRow tr = new TableRow();
		tr.addCell("node 2");
		tr.addCell("0");
		tr.addCell("0");
		tr.addCell("0");
		dtMaut.addRow(tr);
		
		tr = new TableRow();
		tr.addCell("node 3");
		tr.addCell("0");
		tr.addCell("0");
		tr.addCell("0");
		dtMaut.addRow(tr);
		
		return dtMaut;
	}
	
//	private void createFolder(DocsService client, String title) throws IOException, ServiceException {
//		FolderEntry newEntry = new FolderEntry();
//		newEntry.setTitle(new PlainTextConstruct(title));
//		URL feedUrl = new URL("https://docs.google.com/feeds/default/private/full/");
//		client.insert(feedUrl, newEntry);
//	}
}