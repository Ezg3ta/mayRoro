package com.mayroro.util;

import com.google.visualization.datasource.datatable.value.ValueType;

public class ColumnDescription {
	private String id;
	private String type;
	private String label;
	private String pattern;
	
	public ColumnDescription(){}

	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getLabel() {
		return label;
	}
	public void setLabel(String label) {
		this.label = label;
	}
	public String getPattern() {
		return pattern;
	}
	public void setPattern(String pattern) {
		this.pattern = pattern;
	}
	
	public com.google.visualization.datasource.datatable.ColumnDescription convert(){
		com.google.visualization.datasource.datatable.ColumnDescription converted = new com.google.visualization.datasource.datatable.ColumnDescription(id,ValueType.valueOf(type), label);
		converted.setPattern(pattern);
		return converted;
	}
}
