package com.mayroro.util;

import java.util.ArrayList;
import java.util.List;

import com.google.visualization.datasource.datatable.value.ValueType;

public class TableRow {
	private List<TableCell> c;
	
	public TableRow(){
		c = new ArrayList<TableCell>();
	}

	public List<TableCell> getC() {
		return c;
	}
	public void setC(List<TableCell> cells) {
		this.c = cells;
	}
	public TableCell getCell(int col){
		return c.get(col);
	}
	public void addCell(TableCell cell) {
	    c.add(cell);
	}
	public void addCell(String value){
		c.add(new TableCell(value));
	}
	
	public com.google.visualization.datasource.datatable.TableRow convert(List<ValueType> columnTypes){
		com.google.visualization.datasource.datatable.TableRow converted = new com.google.visualization.datasource.datatable.TableRow();
		int i = 0;
		for (TableCell tc : c){
			converted.addCell(tc.convert(columnTypes.get(i)));
			i++;
		}
		return converted;
	}
}
