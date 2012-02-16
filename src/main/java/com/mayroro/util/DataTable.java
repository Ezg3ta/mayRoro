package com.mayroro.util;

import java.util.ArrayList;
import java.util.List;

import com.google.visualization.datasource.base.TypeMismatchException;
import com.google.visualization.datasource.datatable.value.ValueType;


public class DataTable {
	private List<ColumnDescription> columns;
	private List<TableRow> rows;
	
	public DataTable(){
		columns = new ArrayList<ColumnDescription>();
		rows = new ArrayList<TableRow>();
	}

	public List<ColumnDescription> getColumns() {
		return columns;
	}
	public void setColumns(List<ColumnDescription> columns) {
		this.columns = columns;
	}
	public List<TableRow> getRows() {
		return rows;
	}
	public void setRows(List<TableRow> rows) {
		this.rows = rows;
	}
	public void addColumn(ColumnDescription column) {
	    columns.add(column);
	}
	public void addRow(TableRow row) {
	    rows.add(row);
	}
	
	public com.google.visualization.datasource.datatable.DataTable convert() throws TypeMismatchException{
		com.google.visualization.datasource.datatable.DataTable converted = new com.google.visualization.datasource.datatable.DataTable();
		for (ColumnDescription cd : columns){
			converted.addColumn(cd.convert());
		}
		List<ValueType> columnTypes = new ArrayList<ValueType>();
		for (int i = 0; i < converted.getColumnDescriptions().size(); i++){
			columnTypes.add(converted.getColumnDescription(i).getType());
		}
		for (TableRow tr : rows){
			converted.addRow(tr.convert(columnTypes));
		}
		return converted;
	}
}
