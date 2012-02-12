package com.mayroro.controllers;


import javax.servlet.http.*;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

@Controller
@RequestMapping("/home")
public class HomeController {
	@RequestMapping("")
	public ModelAndView welcomeHandler(HttpServletRequest req, HttpServletResponse res) {
		ModelAndView mv = new ModelAndView("home");
		
		String accessToken = (String) req.getAttribute("accessToken");
		String authorizationCode = (String) req.getAttribute("authorizationCode");
		
		System.out.println("AT: "+accessToken);
		System.out.println("AC: "+authorizationCode);
		
		return mv;
	}
}
