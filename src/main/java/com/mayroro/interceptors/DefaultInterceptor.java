package com.mayroro.interceptors;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import com.mayroro.util.UserInfo;

public class DefaultInterceptor extends HandlerInterceptorAdapter {
	private String[] excludedURIs;
	private String resourceURI;
	
	public DefaultInterceptor(String[] param_list){
		excludedURIs = param_list;
		resourceURI = "/mayRoro/resources";
	}

	@Override
	public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
		String reqURI = req.getRequestURI();
		System.out.println(reqURI);
		boolean intercept = true;
		
		// Ali gre za request resourcev
		if (reqURI.contains(resourceURI.subSequence(0, resourceURI.length())))
			return true;
		// Ali gre za stran, kjer ne rabiš biti loginan
		else {
			for (String URI : excludedURIs){
				if (reqURI.equals(URI)){
					intercept = false;
					break;
				}
			}
		}

		HttpSession session = req.getSession();
		
		req.setAttribute("intercept", intercept);
		
		/*
		// Strani, kjer moraš biti loginan
		if (intercept){
			if (session.getAttribute("userInfo") != null){
				req.setAttribute("intercept", intercept);
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
		*/
		return true;
	}

	@Override
	public void postHandle(HttpServletRequest req, HttpServletResponse res, Object handler, ModelAndView mv) throws Exception {
		boolean intercept = req.getAttribute("intercept") != null;
		
		// Strani, ki rabijo objekte iz sessiona
		if (intercept){
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
