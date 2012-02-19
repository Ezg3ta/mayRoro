package com.mayroro.util;

import com.google.visualization.datasource.datatable.value.BooleanValue;
import com.google.visualization.datasource.datatable.value.NumberValue;
import com.google.visualization.datasource.datatable.value.TextValue;
import com.google.visualization.datasource.datatable.value.Value;
import com.google.visualization.datasource.datatable.value.ValueType;

public class TableCell {
	private String v;
	private String f;
	
	public TableCell() {}
	public TableCell(String value){
		this.setValue(value);
	}
	
	public String getValue() {
		return v;
	}
	
	public void setValue(String value) {
		this.v = value;
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
	
	public String getF() {
		return f;
	}
	public void setF(String f) {
		this.f = f;
	}
	public com.google.visualization.datasource.datatable.TableCell convert(ValueType vt){
		Value value;
		
		if (v == null)
			value = Value.getNullValueFromValueType(vt);
		else if (vt.equals(ValueType.BOOLEAN))
			value = BooleanValue.getInstance(Boolean.parseBoolean(v));
		else if (vt.equals(ValueType.NUMBER))
			value = new NumberValue(Double.parseDouble(v));
		else 
			value = new TextValue(v);
		
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
		
		return new com.google.visualization.datasource.datatable.TableCell(value, f);
	}
	
	public String toString(){
		if (this.f == null)
			return v;
		return f;
	}
}
