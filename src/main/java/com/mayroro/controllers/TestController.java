package com.mayroro.controllers;

import com.google.api.client.auth.oauth2.draft10.AccessTokenResponse;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessProtectedResource;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessTokenRequest.GoogleAuthorizationCodeGrant;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAuthorizationRequestUrl;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/test")
public class TestController {
	private static final String SCOPE = "http://docs.google.com/feeds/ http://spreadsheets.google.com/feeds/ https://www.googleapis.com/auth/urlshortener";
	private static final String CALLBACK_URL = "http://localhost:8080/mayRoro/home";
	private static final HttpTransport TRANSPORT = new NetHttpTransport();
	private static final JsonFactory JSON_FACTORY = new JacksonFactory();

	// FILL THESE IN WITH YOUR VALUES FROM THE API CONSOLE
	private static final String CLIENT_ID = "109101120972.apps.googleusercontent.com";
	private static final String CLIENT_SECRET = "qGVNHCEhrkt_O1Lqos5Qe2XH";

	@RequestMapping("")
	public static void test() throws IOException {
		// Generate the URL to which we will direct users
		String authorizeUrl = new GoogleAuthorizationRequestUrl(CLIENT_ID, CALLBACK_URL, SCOPE).build();
		
		System.out.println("Paste this url in your browser: " + authorizeUrl);

		// Wait for the authorization code
		System.out.println("Type the code you received here: ");
		BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
		String authorizationCode = in.readLine();

		// Exchange for an access and refresh token
		GoogleAuthorizationCodeGrant authRequest = new GoogleAuthorizationCodeGrant(TRANSPORT, JSON_FACTORY, CLIENT_ID, CLIENT_SECRET,
					authorizationCode, CALLBACK_URL);
		authRequest.useBasicAuthorization = false;
		AccessTokenResponse authResponse;
		
		authResponse = authRequest.execute();
		
		String accessToken = authResponse.accessToken;
		GoogleAccessProtectedResource access = new GoogleAccessProtectedResource(accessToken, TRANSPORT, JSON_FACTORY, CLIENT_ID, CLIENT_SECRET,
					authResponse.refreshToken);
		HttpRequestFactory rf = TRANSPORT.createRequestFactory(access);
		System.out.println("Access token: " + authResponse.accessToken);

		// Refresh a token (SHOULD ONLY BE DONE WHEN ACCESS TOKEN EXPIRES)
		access.refreshToken();
		System.out.println("Original Token: " + accessToken + " New Token: " + access.getAccessToken());
		
		GenericUrl shortenEndpoint = new GenericUrl("https://www.googleapis.com/urlshortener/v1/url");
	    String requestBody =
	        "{\"longUrl\":\"http://farm6.static.flickr.com/5281/5686001474_e06f1587ff_o.jpg\"}";
	    HttpRequest request = rf.buildPostRequest(shortenEndpoint, new ByteArrayContent(requestBody, new byte[requestBody.length()]));
	    request.getHeaders().setContentType("application/json");
	    
	    HttpResponse shortUrl = request.execute();
	    
	    BufferedReader output = new BufferedReader(new InputStreamReader(shortUrl.getContent()));
	    System.out.println("Shorten Response: ");
	    for (String line = output.readLine(); line != null; line = output.readLine()) {
	      System.out.println(line);
	    }
		
	}
}


// @Controller
// 
// @RequestMapping("/test") public class UrlShortenerTest {
// 
// @RequestMapping("") public static void here() { try { DocsService service =
// new DocsService("Document List Demo");
// service.setUserCredentials("lovro.mazgon@gmail.com", "GESLO");
// 
// URL documentListFeedUrl = new
// URL("https://docs.google.com/feeds/default/private/full");
// 
// DocumentListFeed feed = service.getFeed(documentListFeedUrl,
// DocumentListFeed.class);
// 
// for (DocumentListEntry entry : feed.getEntries()){
// System.out.println(entry.getType()+": "+entry.getTitle().getPlainText()); } }
// catch (Exception e){ System.err.println("Exception: " + e.getMessage()); } }
// }
 