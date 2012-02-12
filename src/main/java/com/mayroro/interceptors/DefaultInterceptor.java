package com.mayroro.interceptors;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

public class DefaultInterceptor extends HandlerInterceptorAdapter {
	private String[] excludedURIs;
	
	public DefaultInterceptor(String[] param_list){
		excludedURIs = param_list;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		System.out.println("RequestURI: "+request.getRequestURI());
		
		boolean intercept = true;
		for (String URI : excludedURIs){
			System.out.println("ExcludedURI: "+URI);
			if (request.getRequestURI().contains(URI.subSequence(0, URI.length()))){
				intercept = false;
				break;
			}
		}
		
		System.out.println(intercept);
		
		return true;
	}

//	@Override
//	public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
//		// TODO Auto-generated method stub
//		
//	}
//
//	@Override
//	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
//		// TODO Auto-generated method stub
//		
//	}
}
