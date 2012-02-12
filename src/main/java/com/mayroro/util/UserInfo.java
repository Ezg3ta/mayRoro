package com.mayroro.util;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessProtectedResource;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpResponse;
import com.google.gson.Gson;

public class UserInfo {
	private String id;
	private String email;
	private boolean verified_email;
	private String name;
	private String given_name;
	private String family_name;
	private String picture;
	private String locale;
	private String timezone;
	private String gender;
	private String access_token;
	private String refresh_token;
	
	public String getId() {
		return id;
	}
	public void setId(String id){
		this.id = id;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public boolean isVerified_email() {
		return verified_email;
	}
	public void setVerified_email(boolean verified_email) {
		this.verified_email = verified_email;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getGiven_name() {
		return given_name;
	}
	public void setGiven_name(String given_name) {
		this.given_name = given_name;
	}
	public String getFamily_name() {
		return family_name;
	}
	public void setFamily_name(String family_name) {
		this.family_name = family_name;
	}
	public String getPicture() {
		return picture;
	}
	public void setPicture(String picture) {
		this.picture = picture;
	}
	public String getLocale() {
		return locale;
	}
	public void setLocale(String locale) {
		this.locale = locale;
	}
	public String getTimezone() {
		return timezone;
	}
	public void setTimezone(String timezone) {
		this.timezone = timezone;
	}
	public String getGender() {
		return gender;
	}
	public void setGender(String gender) {
		this.gender = gender;
	}
	public String getAccess_token() {
		return access_token;
	}
	public void setAccess_token(String access_token) {
		this.access_token = access_token;
	}
	public String getRefresh_token() {
		return refresh_token;
	}
	public void setRefresh_token(String refresh_token) {
		this.refresh_token = refresh_token;
	}
	@Override
	public String toString(){
		return 	"id: "+getId()+"\n"+
				"email: "+getEmail()+"\n"+
				"verifiedEmail: "+isVerified_email()+"\n"+
				"name: "+getName()+"\n"+
				"givenName: "+getGiven_name()+"\n"+
				"familyName: "+getFamily_name()+"\n"+
				"picture: "+getPicture()+"\n"+
				"locale: "+getLocale()+"\n"+
				"timezone: "+getTimezone()+"\n"+
				"gender: "+getGender();
	}
	
	public static UserInfo build(String accessToken, String refreshToken) throws IOException {
		GoogleAccessProtectedResource access = new GoogleAccessProtectedResource(accessToken, Constants.TRANSPORT, Constants.JSON_FACTORY, Constants.CLIENT_ID, Constants.CLIENT_SECRET, refreshToken);
		HttpRequestFactory rf = Constants.TRANSPORT.createRequestFactory(access);
		
		GenericUrl userInfoUrl = new GenericUrl("https://www.googleapis.com/oauth2/v1/userinfo?access_token="+accessToken);
		
		HttpRequest request = rf.buildGetRequest(userInfoUrl);
		HttpResponse response = request.execute();
		
		InputStream is = response.getContent();
		Reader isr = new InputStreamReader(is, "UTF-8");
		
		Gson gson = new Gson();
		UserInfo ui = gson.fromJson(isr, UserInfo.class);
		
		ui.setAccess_token(accessToken);
		ui.setRefresh_token(refreshToken);
		
		return ui;
	}
}
