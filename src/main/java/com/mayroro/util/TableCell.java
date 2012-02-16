package com.mayroro.util;

import com.google.visualization.datasource.datatable.value.BooleanValue;
import com.google.visualization.datasource.datatable.value.NumberValue;
import com.google.visualization.datasource.datatable.value.TextValue;
import com.google.visualization.datasource.datatable.value.Value;
import com.google.visualization.datasource.datatable.value.ValueType;

public class TableCell {
	private String value;
	private String formattedValue;
	
	public TableCell() {}
	
	public String getValue() {
		return value;
	}
	
	public void setValue(String value) {
		this.value = value;
	}
//	public void setValue(boolean value) {
//		this.value = BooleanValue.getInstance(value);
//	}
//	public void setValue(double value) {
//		this.value = new NumberValue(value);
//	}
//	public void setValue(double value){
//		this.value = value;
//	}
	
	public String getFormattedValue() {
		return formattedValue;
	}
	public void setFormattedValue(String formattedValue) {
		this.formattedValue = formattedValue;
	}
	public com.google.visualization.datasource.datatable.TableCell convert(ValueType vt){
		Value v;
		
		if (value == null)
			v = Value.getNullValueFromValueType(vt);
		else if (vt.equals(ValueType.BOOLEAN))
			v = BooleanValue.getInstance(Boolean.parseBoolean(value));
		else if (vt.equals(ValueType.NUMBER))
			v = new NumberValue(Double.parseDouble(value));
		else 
			v = new TextValue(value);
		
//		try {
//			double convertedValue = Double.parseDouble(value);
//			v = new NumberValue(convertedValue);
//		}catch (Exception e) {
//			if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value))
//				v = BooleanValue.getInstance(Boolean.parseBoolean(value));
//			if (value == null)
//				v = Value.getNullValueFromValueType(vt);
//			else
//				v = new TextValue(value);
//		}
		
		return new com.google.visualization.datasource.datatable.TableCell(v, formattedValue);
	}
}
