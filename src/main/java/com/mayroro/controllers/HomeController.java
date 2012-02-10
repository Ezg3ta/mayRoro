package com.mayroro.controllers;

import java.io.IOException;

import javax.servlet.http.*;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import com.google.api.client.auth.oauth2.draft10.AccessTokenResponse;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessProtectedResource;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessTokenRequest.GoogleAuthorizationCodeGrant;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;

/**
 * Servlet implementation class homeController
 */
@Controller
@RequestMapping("/home")
public class HomeController {
	private static final String CALLBACK_URL = "http://localhost:8080/mayRoro/home";
	private static final HttpTransport TRANSPORT = new NetHttpTransport();
	private static final JsonFactory JSON_FACTORY = new JacksonFactory();

	// FILL THESE IN WITH YOUR VALUES FROM THE API CONSOLE
	private static final String CLIENT_ID = "109101120972.apps.googleusercontent.com";
	private static final String CLIENT_SECRET = "qGVNHCEhrkt_O1Lqos5Qe2XH";
	
	@RequestMapping("")
	public ModelAndView welcomeHandler(HttpServletRequest req, HttpServletResponse res) {
		ModelAndView mv = new ModelAndView("home");
		
		// Check for errors
		String error = req.getParameter("error");
		if (error != null)
			return new ModelAndView("forward:/error?type="+error);
		
		// Get authorization code
		String authorizationCode = req.getParameter("code");
		
		if(authorizationCode == null)
			return new ModelAndView("forward:/error?type=no_authorization_code");
		
		// Exchange for an access and refresh token
		try{
			GoogleAuthorizationCodeGrant authRequest = new GoogleAuthorizationCodeGrant(TRANSPORT, JSON_FACTORY, CLIENT_ID, CLIENT_SECRET,
						authorizationCode, CALLBACK_URL);
			authRequest.useBasicAuthorization = false;
			AccessTokenResponse authResponse = authRequest.execute();
			if(authResponse.accessToken == null)
				throw new IOException();
			String accessToken = authResponse.accessToken;
			mv.addObject("accessToken", accessToken);
		} catch (IOException e) {
			return new ModelAndView("forward:/error?type=no_access_token");
		}
		
		mv.addObject("authorizationCode", authorizationCode);
		
		return mv;
	}
}
