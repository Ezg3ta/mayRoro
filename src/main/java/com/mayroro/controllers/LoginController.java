package com.mayroro.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAuthorizationRequestUrl;

@Controller
@RequestMapping("/login")
public class LoginController {
	private static final String SCOPE = "http://docs.google.com/feeds/ http://spreadsheets.google.com/feeds/";
	private static final String CALLBACK_URL = "http://localhost:8080/mayRoro/home";

	// FILL THESE IN WITH YOUR VALUES FROM THE API CONSOLE
	private static final String CLIENT_ID = "109101120972.apps.googleusercontent.com";
	
	@RequestMapping("")
	public String login(){
		String authorizeUrl = new GoogleAuthorizationRequestUrl(CLIENT_ID, CALLBACK_URL, SCOPE).build()+"&hl=sl";
		System.out.println(authorizeUrl);
		return "redirect:"+authorizeUrl;
	}
}
