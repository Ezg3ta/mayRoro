package com.mayroro.util;

import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;

public class ConstFunc {
	public static final String SPREADSHEET_PREFIX = "*mayRoro-";
	public static final String CALLBACK_URL = "http://localhost:8080/mayRoro/login";
	public static final String CLIENT_ID = "109101120972.apps.googleusercontent.com";
	public static final String CLIENT_SECRET = "qGVNHCEhrkt_O1Lqos5Qe2XH";
	public static final String SCOPE = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email http://docs.google.com/feeds/ http://spreadsheets.google.com/feeds/";
	
	public static final HttpTransport TRANSPORT = new NetHttpTransport();
	public static JsonFactory JSON_FACTORY = new GsonFactory();
}
