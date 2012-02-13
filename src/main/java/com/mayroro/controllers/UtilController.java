package com.mayroro.controllers;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import com.google.gdata.client.docs.DocsService;
import com.mayroro.util.ConstFunc;
import com.mayroro.util.UserInfo;

@Controller
@RequestMapping("/util")
public class UtilController {
	@RequestMapping("/new_spreadsheet")
	public ModelAndView newSpreadsheet(HttpServletRequest req, HttpServletResponse res){
		ModelAndView mv = new ModelAndView("redirect:/home");
		
		HttpSession session = req.getSession();
		UserInfo ui = (UserInfo)session.getAttribute("userInfo");
		
		DocsService service = new DocsService("mayRoro");
		service.setHeader("Authorization", "OAuth "+ui.getAccess_token());
		
		String title = null;
		title = req.getParameter("title");
		if(title == null)
			return new ModelAndView("forward:/error?type=parameter_missing");
		
		try {
			ConstFunc.createNewSpreadsheet(service, "*mayRoro-"+title);
		} catch (Exception e) {
			return new ModelAndView("forward:/error?type=new_spreadsheet_error");
		}
		
		return mv;
	}
}