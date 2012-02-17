package com.mayroro.interceptors;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import com.mayroro.util.UserInfo;

public class DefaultInterceptor extends HandlerInterceptorAdapter {
	private String[] noLoginURIs;
	private String[] skipURIs;
	
	public DefaultInterceptor(String[] noLogin, String[] skip){
		noLoginURIs = noLogin;
		skipURIs = skip;
	}

	@Override
	public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
		String reqURI = req.getRequestURI();
		boolean login = true;
		
		// Ali gre za stran, ki jo je treba preskoèiti
		for (String URI : skipURIs){
			if (reqURI.startsWith(URI))
				return true;
		}
		// Ali gre za stran, kjer ne rabiš biti loginan
		for (String URI : noLoginURIs){
			if (reqURI.equals(URI)){
				login = false;
				break;
			}
		}

		HttpSession session = req.getSession();
		
		// Strani, kjer moraš biti loginan
		if (login){
			if (session.getAttribute("userInfo") != null){
				req.setAttribute("login", login);
				return true;
			}
			else
				res.sendRedirect(req.getContextPath()+"/index");
		}
		
		// Strani, kjer ne smeš bit loginan
		else {
			if (session.getAttribute("userInfo") == null)
				return true;
			else
				res.sendRedirect(req.getContextPath()+"/home");
		}
		
		return false;
	}

	@Override
	public void postHandle(HttpServletRequest req, HttpServletResponse res, Object handler, ModelAndView mv) throws Exception {
		boolean login = req.getAttribute("login") != null;
		
		// Strani, ki rabijo objekte iz sessiona
		if (login){
			UserInfo ui = (UserInfo) req.getSession().getAttribute("userInfo");
			mv.addObject("userInfo", ui);
		}
	}
//
//	@Override
//	public void afterCompletion(HttpServletRequest req, HttpServletResponse res, Object handler, Exception ex) throws Exception {
//		// TODO Auto-generated method stub
//		
//	}
}
