package com.mayroro.controllers;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import com.google.api.client.auth.oauth2.draft10.AccessTokenResponse;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessProtectedResource;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessTokenRequest.GoogleAuthorizationCodeGrant;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpResponse;
import com.google.gson.Gson;
import com.mayroro.util.Constants;
import com.mayroro.util.UserInfo;

@Controller
@RequestMapping("/login")
public class LoginController {
	@RequestMapping("")
	public ModelAndView login(HttpServletRequest req, HttpServletResponse res){
		ModelAndView mv = new ModelAndView("redirect:/home");
		
		// Check for errors
		String error = req.getParameter("error");
		if (error != null)
			return new ModelAndView("forward:/error?type="+error);
		
		// Get authorization code
		String authorizationCode = req.getParameter("code");
		
		if(authorizationCode == null)
			return new ModelAndView("forward:/error?type=no_authorization_code");
		
		// Exchange for an access and refresh token

		GoogleAuthorizationCodeGrant authRequest = new GoogleAuthorizationCodeGrant(Constants.TRANSPORT, Constants.JSON_FACTORY, Constants.CLIENT_ID, Constants.CLIENT_SECRET,
					authorizationCode, Constants.CALLBACK_URL);
		authRequest.useBasicAuthorization = false;
		AccessTokenResponse authResponse = null;
		try{
			authResponse = authRequest.execute();
			if(authResponse.accessToken == null)
				throw new IOException();
		} catch (IOException e) {
			return new ModelAndView("forward:/error?type=no_access_token");
		}
		String accessToken = authResponse.accessToken;
		
		System.out.println("accessToken: "+accessToken);
		
		// Get user data
		
		GoogleAccessProtectedResource access = new GoogleAccessProtectedResource(accessToken, Constants.TRANSPORT, Constants.JSON_FACTORY, Constants.CLIENT_ID, Constants.CLIENT_SECRET,
					authResponse.refreshToken);
		HttpRequestFactory rf = Constants.TRANSPORT.createRequestFactory(access);
		
		
		GenericUrl userInfoUrl = new GenericUrl("https://www.googleapis.com/oauth2/v1/userinfo?access_token="+accessToken);
		
		try {
			HttpRequest request = rf.buildGetRequest(userInfoUrl);
			HttpResponse response = request.execute();
			
			InputStream is = response.getContent();
			Reader isr = new InputStreamReader(is, "UTF-8");
			
			Gson gson = new Gson();
			UserInfo ui = gson.fromJson(isr, UserInfo.class);
			System.out.println(ui);
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		return mv;
	}
}
