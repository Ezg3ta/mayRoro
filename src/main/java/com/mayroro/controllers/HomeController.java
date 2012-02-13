package com.mayroro.controllers;


import java.io.IOException;
import java.net.URL;
import java.util.List;

import javax.servlet.http.*;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import com.google.gdata.client.docs.DocsService;
import com.google.gdata.data.spreadsheet.SpreadsheetEntry;
import com.google.gdata.data.spreadsheet.SpreadsheetFeed;
import com.google.gdata.util.ServiceException;
import com.mayroro.util.ConstFunc;
import com.mayroro.util.UserInfo;

@Controller
@RequestMapping("/home")
public class HomeController {
	@RequestMapping("")
	public ModelAndView welcomeHandler(HttpServletRequest req, HttpServletResponse res) throws IOException, ServiceException {
		ModelAndView mv = new ModelAndView("home");
		
		HttpSession session = req.getSession();
		UserInfo ui = (UserInfo)session.getAttribute("userInfo");
		
		String accessToken = ui.getAccess_token();
		String refreshToken = ui.getRefresh_token();
		
		System.out.println("AT: "+accessToken);
		System.out.println("RT: "+refreshToken);
		
		mv.addObject("userInfo", ui);
		System.out.println(ui);
		
		DocsService service = new DocsService("mayRoro");
		service.setHeader("Authorization", "OAuth "+accessToken);
		
		try {
			URL metafeedUrl = new URL("https://spreadsheets.google.com/feeds/spreadsheets/private/full");
			SpreadsheetFeed feed = service.getFeed(metafeedUrl, SpreadsheetFeed.class);
			List<SpreadsheetEntry> spreadsheets = feed.getEntries();
			for (int i = 0; i < spreadsheets.size(); i++) {
				SpreadsheetEntry entry = spreadsheets.get(i);
				System.out.println("\t" + entry.getTitle().getPlainText());
				System.out.println(entry.getKey());
			}
			mv.addObject("spreadsheets", spreadsheets);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		String newSpreadsheet = null;
		newSpreadsheet = req.getParameter("new_spreadsheet");
		if("true".equals(newSpreadsheet)){
			ConstFunc.createNewSpreadsheet(service, "*mayRoro-Ustvarjen projekt");
		}
		
		return mv;
	}
}