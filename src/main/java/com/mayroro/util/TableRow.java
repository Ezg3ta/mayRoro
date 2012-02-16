package com.mayroro.util;

import java.util.ArrayList;
import java.util.List;

import com.google.visualization.datasource.datatable.value.ValueType;

public class TableRow {
	private List<TableCell> cells;
	
	public TableRow(){
		cells = new ArrayList<TableCell>();
	}

	public List<TableCell> getCells() {
		return cells;
	}
	public void setCells(List<TableCell> cells) {
		this.cells = cells;
	}
	public void addCell(TableCell cell) {
	    cells.add(cell);
	}
	
	public com.google.visualization.datasource.datatable.TableRow convert(List<ValueType> columnTypes){
		com.google.visualization.datasource.datatable.TableRow converted = new com.google.visualization.datasource.datatable.TableRow();
		int i = 0;
		for (TableCell tc : cells){
			converted.addCell(tc.convert(columnTypes.get(i)));
			i++;
		}
		return converted;
	}
}
