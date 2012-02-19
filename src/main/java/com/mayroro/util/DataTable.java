package com.mayroro.util;

import java.util.ArrayList;
import java.util.List;

import com.google.visualization.datasource.base.TypeMismatchException;
import com.google.visualization.datasource.datatable.value.ValueType;


public class DataTable {
	private List<ColumnDescription> cols;
	private List<TableRow> rows;
	
	public DataTable(){
		cols = new ArrayList<ColumnDescription>();
		rows = new ArrayList<TableRow>();
	}

	public List<ColumnDescription> getCols() {
		return cols;
	}
	public void setCols(List<ColumnDescription> cols) {
		this.cols = cols;
	}
	public List<TableRow> getRows() {
		return rows;
	}
	public void setRows(List<TableRow> rows) {
		this.rows = rows;
	}
	public void addCol(ColumnDescription col) {
	    cols.add(col);
	}
	public void addRow(TableRow row) {
	    rows.add(row);
	}
	
	public TableCell getCell(int row, int col){
		return rows.get(row).getCell(col);
	}
	
	public void removeEmptyRows(){
		List<TableRow> removeRows = new ArrayList<TableRow>();
		for (TableRow row : rows){
			boolean empty = true;
			for (TableCell tc : row.getC()){
				if (!"".equals(tc.getValue()) && tc.getValue() != null){
					empty = false;
					break;
				}
			}
			if (empty){
				removeRows.add(row);
			}
		}
		rows.removeAll(removeRows);
	}
	
	public com.google.visualization.datasource.datatable.DataTable convert() throws TypeMismatchException{
		com.google.visualization.datasource.datatable.DataTable converted = new com.google.visualization.datasource.datatable.DataTable();
		for (ColumnDescription cd : cols){
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
	
	public String toString(){
		StringBuilder sb = new StringBuilder();

	    for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
	      TableRow tableRow = rows.get(rowIndex);
	      for (int cellIndex = 0; cellIndex < tableRow.getC().size(); cellIndex++) {
	        TableCell tableCell = tableRow.getC().get(cellIndex);
	        sb.append(tableCell.toString());
	        if (cellIndex < tableRow.getC().size() - 1) {
	          sb.append(",");
	        }
	      }
	      if (rowIndex < rows.size() - 1) {
	        sb.append("\n");
	      }
	    }

	    return sb.toString();
	}
	public String colsToString(){
		StringBuilder sb = new StringBuilder();
		
		for (int cdIndex = 0; cdIndex < cols.size(); cdIndex++){
			sb.append(cols.get(cdIndex).getLabel());
			if (cdIndex < cols.size() - 1)
				sb.append(",");
		}
		
		return sb.toString();
	}
}
