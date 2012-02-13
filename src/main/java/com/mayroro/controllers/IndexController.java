package com.mayroro.controllers;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAuthorizationRequestUrl;
import com.mayroro.util.ConstFunc;

@Controller
@RequestMapping(value={"/", "/index"})
public class IndexController {
	@RequestMapping("")
	public ModelAndView welcomeHandler(HttpServletRequest req, HttpServletResponse res) {
		ModelAndView mv = new ModelAndView("index");
		
		String loginUrl = new GoogleAuthorizationRequestUrl(ConstFunc.CLIENT_ID, ConstFunc.CALLBACK_URL, ConstFunc.SCOPE).build();
		mv.addObject("loginUrl", loginUrl);
		
		return mv;
	}
}
