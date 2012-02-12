package com.mayroro.controllers;


import javax.servlet.http.*;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import com.mayroro.util.UserInfo;

@Controller
@RequestMapping("/home")
public class HomeController {
	@RequestMapping("")
	public ModelAndView welcomeHandler(HttpServletRequest req, HttpServletResponse res) {
		ModelAndView mv = new ModelAndView("home");
		
		HttpSession session = req.getSession();
		UserInfo ui = (UserInfo)session.getAttribute("userInfo");
		
		String accessToken = ui.getAccess_token();
		
		System.out.println("AT: "+accessToken);
		
		mv.addObject("userInfo", ui);
		
		return mv;
	}
}
