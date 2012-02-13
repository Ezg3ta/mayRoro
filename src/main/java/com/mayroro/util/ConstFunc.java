package com.mayroro.util;

import java.io.IOException;
import java.net.URL;

import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.gdata.client.docs.DocsService;
import com.google.gdata.data.PlainTextConstruct;
import com.google.gdata.data.docs.SpreadsheetEntry;
import com.google.gdata.util.ServiceException;

public class ConstFunc {
	public static final String CALLBACK_URL = "http://localhost:8080/mayRoro/login";
	public static final String CLIENT_ID = "109101120972.apps.googleusercontent.com";
	public static final String CLIENT_SECRET = "qGVNHCEhrkt_O1Lqos5Qe2XH";
	public static final String SCOPE = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email http://docs.google.com/feeds/ http://spreadsheets.google.com/feeds/";
	
	public static final HttpTransport TRANSPORT = new NetHttpTransport();
	public static JsonFactory JSON_FACTORY = new GsonFactory();
	
	public static SpreadsheetEntry createNewSpreadsheet(DocsService client, String title) throws IOException, ServiceException {
		SpreadsheetEntry newEntry = new SpreadsheetEntry();
		newEntry.setTitle(new PlainTextConstruct(title));
		
		// Prevent collaborators from sharing the document with others?
		// newEntry.setWritersCanInvite(false);

		// You can also hide the document on creation
		// newEntry.setHidden(true);
		
		return client.insert(new URL("https://docs.google.com/feeds/default/private/full/"), newEntry);
	}
}
