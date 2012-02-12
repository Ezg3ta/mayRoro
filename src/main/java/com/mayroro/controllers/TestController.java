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
import com.google.gdata.client.authn.oauth.GoogleOAuthHelper;
import com.google.gdata.client.authn.oauth.GoogleOAuthParameters;
import com.google.gdata.client.authn.oauth.OAuthException;
import com.google.gdata.client.authn.oauth.OAuthHmacSha1Signer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/test")
public class TestController {
	private static final String SCOPE = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email http://docs.google.com/feeds/ http://spreadsheets.google.com/feeds/";
	private static final String CALLBACK_URL = "http://localhost:8080/mayRoro/home";
	private static final HttpTransport TRANSPORT = new NetHttpTransport();
	private static final JsonFactory JSON_FACTORY = new JacksonFactory();

	// FILL THESE IN WITH YOUR VALUES FROM THE API CONSOLE
	private static final String CLIENT_ID = "109101120972.apps.googleusercontent.com";
	private static final String CLIENT_SECRET = "qGVNHCEhrkt_O1Lqos5Qe2XH";

	@RequestMapping("")
	public static void test() throws IOException {

		GoogleOAuthParameters oauthParameters = new GoogleOAuthParameters();
		oauthParameters.setOAuthConsumerKey(CLIENT_ID);
		oauthParameters.setOAuthConsumerSecret(CLIENT_SECRET);
		oauthParameters.setScope(SCOPE);
		oauthParameters.setOAuthCallback(CALLBACK_URL);

		GoogleOAuthHelper oauthHelper = new GoogleOAuthHelper(new OAuthHmacSha1Signer());
		try {
			oauthHelper.getUnauthorizedRequestToken(oauthParameters);
		} catch (OAuthException e) {
			e.printStackTrace();
		}
		
		String approvalPageUrl = oauthHelper.createUserAuthorizationUrl(oauthParameters);
		System.out.println(approvalPageUrl);
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
 