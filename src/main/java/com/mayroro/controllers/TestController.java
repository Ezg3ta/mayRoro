package com.mayroro.controllers;

import java.io.IOException;
import java.lang.reflect.Type;

import com.google.api.client.http.HttpTransport;
import com.google.visualization.datasource.base.TypeMismatchException;
import com.google.visualization.datasource.datatable.DataTable;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.JsonParser;
import com.google.api.client.json.JsonToken;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.InstanceCreator;
import com.google.gson.JsonSyntaxException;

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

	private static String drevo = "{\"cols\":[{\"id\":\"A\",\"label\":\"\",\"type\":\"string\",\"pattern\":\"\"},{\"id\":\"B\",\"label\":\"\",\"type\":\"string\",\"pattern\":\"\"},{\"id\":\"C\",\"label\":\"\",\"type\":\"number\",\"pattern\":\"#0.###############\"}],\"rows\":[{\"c\":[{\"v\":\"majer\"},{\"v\":\"mama\"},{\"v\":0.4,\"f\":\"0,4\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"mama\\\"  nodeId=\\\"0\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"doer\\\"  nodeId=\\\"2\\\"/>\"},{\"v\":0.2,\"f\":\"0,2\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"gad\\\"  nodeId=\\\"3\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"mama\\\"  nodeId=\\\"0\\\"/>\"},{\"v\":0.3,\"f\":\"0,3\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"roro\\\"  nodeId=\\\"4\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"mama\\\"  nodeId=\\\"0\\\"/>\"},{\"v\":0.34,\"f\":\"0,34\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"num\\\"  nodeId=\\\"5\\\"/>\"},{\"v\":\"<input type=\\\"text\\\" value=\\\"doer\\\"  nodeId=\\\"2\\\"/>\"},{\"v\":0.23,\"f\":\"0,23\"}]},{\"c\":[{\"v\":\"<input type=\\\"text\\\" value=\\\"doer\\\"  nodeId=\\\"2\\\"/>\"},{\"v\":\"\"},{\"v\":null}]}],\"p\":null}";
	
	@RequestMapping("")
	public static void main(String[] args) {
//		DataTable sample = new DataTable();
//		sample.addColumn(new ColumnDescription("A", ValueType.TEXT, ""));
//		sample.addColumn(new ColumnDescription("B", ValueType.TEXT, ""));
//		try {
//			sample.addRow(new TableRow());
//			sample.addRow(new TableRow());
//			sample.setCell(0, 0, new TableCell("vsebina"));
//			sample.setCell(0, 1, new TableCell("0,1"));
//			sample.setCell(1, 0, new TableCell("ena,nula"));
//			sample.setCell(1, 1, new TableCell("1,1"));
//		} catch (TypeMismatchException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//		
//		System.out.println("Col: "+sample.getNumberOfColumns());
//		System.out.println("Row: "+sample.getNumberOfRows());
//		System.out.println("Cell (0,0): "+sample.getCell(0,0).getValue());
//		
//		System.out.println(sample);
//		System.out.println(new Gson().toJson(sample));
		
		Gson gson = new Gson();
		
		DataTable dt;
		try {
			dt = gson.fromJson(jsonDataTable(drevo), com.mayroro.util.DataTable.class).convert();
			System.out.println(dt.getRows().get(1).getCells().get(0).getValue());
			System.out.println(dt);
		} catch (JsonSyntaxException e) {
			e.printStackTrace();
		} catch (TypeMismatchException e) {
			e.printStackTrace();
		}
		
//		jsonParser(new Gson().toJson(sample));
//		System.out.println("------------------------------------------------------");
//		jsonParser(drevo);
	}
	
	private static String jsonDataTable(String json){
		Gson gson = new Gson();
		String converted = json.replaceFirst("cols", "columns");
		converted = converted.replaceAll("\"type\":\"string\"", "\"type\":\"TEXT\"");
		converted = converted.replaceAll("\"type\":\"number\"", "\"type\":\"NUMBER\"");
		converted = converted.replaceAll("\\{\"c\":\\[", "\\{\"cells\":\\[");
		converted = converted.replaceAll("\\{\"v\":", "\\{\"value\":");
		converted = converted.replaceAll("\"f\":", "\"formattedValue\":");
//		converted = converted.replaceAll("\\]\\},\\{\"cells\":\\[", "\\}\\]\\},\\{\"cells\":\\[");
//		converted = converted.replaceAll("\\]\\}\\],\"p\":", "\\}\\]\\}\\],\"p\":");
//		converted = converted.replaceAll("\\},\\{\"v\":", "\\}\\},\\{\"value\":\\{\"value\":");
//		converted = converted.replaceAll("\\{\"v\":", "\\{\"value\":\\{\"value\":");
		System.out.println("1: "+converted);
		return converted;
	}
	
	private static void jsonParser(String json){
		GsonFactory gson = new GsonFactory();
		JsonParser jp = gson.createJsonParser(json);
		try {
			while(jp.nextToken() != null){
				System.out.println(jp.getCurrentToken()+"\t"+jp.getText());
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
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
 