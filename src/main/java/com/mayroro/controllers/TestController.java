package com.mayroro.controllers;

import com.google.api.client.http.HttpTransport;
import com.google.visualization.datasource.datatable.value.ValueType;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.gdata.client.authn.oauth.GoogleOAuthHelper;
import com.google.gdata.client.authn.oauth.GoogleOAuthParameters;
import com.google.gdata.client.authn.oauth.OAuthException;
import com.google.gdata.client.authn.oauth.OAuthHmacSha1Signer;
import com.google.gson.Gson;
import com.google.visualization.datasource.datatable.ColumnDescription;
import com.google.visualization.datasource.datatable.DataTable;

import java.io.IOException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("test")
public class TestController {
	private static final String SCOPE = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email http://docs.google.com/feeds/ http://spreadsheets.google.com/feeds/";
	private static final String CALLBACK_URL = "http://localhost:8080/mayRoro/home";
	private static final HttpTransport TRANSPORT = new NetHttpTransport();
	private static final JsonFactory JSON_FACTORY = new JacksonFactory();

	// FILL THESE IN WITH YOUR VALUES FROM THE API CONSOLE
	private static final String CLIENT_ID = "109101120972.apps.googleusercontent.com";
	private static final String CLIENT_SECRET = "qGVNHCEhrkt_O1Lqos5Qe2XH";

	private static final String drevo = "{\"columns\":[{\"id\":\"A\",\"label\":\"\",\"type\":\"TEXT\",\"pattern\":\"\"},{\"id\":\"B\",\"label\":\"\",\"type\":\"TEXT\",\"pattern\":\"\"},{\"id\":\"C\",\"label\":\"\",\"type\":\"NUMBER\",\"pattern\":\"#0.###############\"}],\"rows\":[{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"majer\\\" nodeId=\\\"1\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"mama\\\"  nodeId=\\\"0\\\"/>\"},{\"v\":0.4,\"f\":\"0,4\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"mama\\\"  nodeId=\\\"0\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"doer\\\"  nodeId=\\\"2\\\"/>\"},{\"v\":0.2,\"f\":\"0,2\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"gad\\\"  nodeId=\\\"3\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"mama\\\"  nodeId=\\\"0\\\"/>\"},{\"v\":0.3,\"f\":\"0,3\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"roro\\\"  nodeId=\\\"4\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"mama\\\"  nodeId=\\\"0\\\"/>\"},{\"v\":0.34,\"f\":\"0,34\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"num\\\"  nodeId=\\\"5\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"doer\\\"  nodeId=\\\"2\\\"/>\"},{\"v\":0.23,\"f\":\"0,23\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"doer\\\"  nodeId=\\\"2\\\"/>\"},{\"v\":\"\"},{\"v\":null}]}]}";

	@RequestMapping("")
	public static void test() {
		Gson gson = new Gson();
		DataTable dataTable = gson.fromJson(drevo, DataTable.class);
		System.out.println("Col: "+dataTable.getNumberOfColumns());
		System.out.println("Row: "+dataTable.getNumberOfRows());
		//System.out.println(dataTable.toString());
		
		DataTable sample = new DataTable();
		sample.addColumn(new ColumnDescription("A", ValueType.TEXT, ""));
		System.out.println("Col: "+sample.getNumberOfColumns());
		System.out.println("Row: "+sample.getNumberOfRows());
		
		System.out.println(drevo);
		System.out.println(gson.toJson(sample));
	}
}

//GoogleOAuthParameters oauthParameters = new GoogleOAuthParameters();
//oauthParameters.setOAuthConsumerKey(CLIENT_ID);
//oauthParameters.setOAuthConsumerSecret(CLIENT_SECRET);
//oauthParameters.setScope(SCOPE);
//oauthParameters.setOAuthCallback(CALLBACK_URL);
//
//GoogleOAuthHelper oauthHelper = new GoogleOAuthHelper(new OAuthHmacSha1Signer());
//try {
//	oauthHelper.getUnauthorizedRequestToken(oauthParameters);
//} catch (OAuthException e) {
//	e.printStackTrace();
//}
//
//String approvalPageUrl = oauthHelper.createUserAuthorizationUrl(oauthParameters);
//System.out.println(approvalPageUrl);



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
 