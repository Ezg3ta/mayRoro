package com.mayroro.controllers;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
@RequestMapping("/error")
public class ErrorController {
	@RequestMapping("")
	public ModelAndView error(HttpServletRequest req, HttpServletResponse res){
		ModelAndView mv = new ModelAndView("error");
		
		String errorType = req.getParameter("type");
		if (errorType == null)
			errorType = "default";
		mv.addObject("errorType", errorType);
		
		return mv;
	}
}
