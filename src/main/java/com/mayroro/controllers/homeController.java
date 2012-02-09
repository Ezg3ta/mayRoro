package com.mayroro.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

/**
 * Servlet implementation class homeController
 */
@Controller
@RequestMapping("/home")
public class homeController {
	
	@RequestMapping("")
	public ModelAndView welcomeHandler() {
		System.out.println("welcome");
		return new ModelAndView("home");
	}
}
