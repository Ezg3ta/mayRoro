package com.mayroro.controllers;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import com.google.api.client.auth.oauth2.draft10.AccessTokenResponse;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessTokenRequest.GoogleAuthorizationCodeGrant;
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
		
		UserInfo ui = new UserInfo();
		try {
			ui = UserInfo.build(accessToken, authResponse.refreshToken);
		} catch (IOException e) {
			return new ModelAndView("forward:/error?type=user_info");
		}
		
		HttpSession session = req.getSession();
		session.setAttribute("userInfo", ui);
		
		return mv;
	}
}
