package com.mayroro.util;

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
	
	public String getId() {
		return id;
	}
//	public void setId(int id) {
//		this.id = id;
//	}
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
}
