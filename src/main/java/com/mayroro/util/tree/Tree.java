package com.mayroro.util.tree;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.ParseException;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

import com.mayroro.util.DataTable;
import com.mayroro.util.TableRow;

public class Tree {
	private TreeNode root;
	
	public Tree(){
		this(null);
	}
	public Tree(DataTable drevo){
		TreeNode root, currentRoot = new TreeNode();
		String child, parent;
		double weight;
		boolean found;
		
		root = currentRoot;
		for (TableRow row : drevo.getRows()){
			if ("".equals(row.getCell(1).getValue()) || row.getCell(1).getValue() == null)
				break;
			child = row.getCell(0).getValue();
			parent = row.getCell(1).getValue();
			weight = Double.parseDouble(row.getCell(2).getValue());
			
			found = false;
			for (TreeNode node : root.getAllNodes()){
				if (parent.equals(node.getName())){
					node.addChild(child, weight);
					found = true;
					break;
				}
				else if (child.equals(node.getName())){
					currentRoot = new TreeNode(parent);
					node.setParent(currentRoot);
					found = true;
					break;
				}
			}
			if (!found){
				currentRoot = new TreeNode(parent);
				currentRoot.addChild(child, weight);
			}
			
			root = currentRoot;
		}
		this.root = root;
	}
	
	public TreeNode getRoot() {
		return root;
	}
	public void setRoot(TreeNode root) {
		this.root = root;
	}
	public void setMautFunction(DataTable funkcije){
		double k, n, min, max;
		SortedMap<Double, Double> funkcijeNode;
		for (int i = 1; i < funkcije.getCols().size(); i += 2){
			for (TreeNode node : getAllNodes()){
				if (node.getName().equals(funkcije.getCols().get(i-1).getLabel())){
					min = Double.parseDouble(funkcije.getCell(0, i-1).getValue());
					max = Double.parseDouble(funkcije.getCell(0, i).getValue());
					k = (max - min)/(20-1);
					n = min - k*1;
					
					funkcijeNode = new TreeMap<Double, Double>();
					for (int j = 1; j < 21; j++){
						funkcijeNode.put((k*j+n),(Double.parseDouble(funkcije.getCell(j, i).getValue())));
					}
					node.setMautFunction(new MautFunction(funkcijeNode));
					break;
				}
			}
		}
	}
	public void setData(DataTable maut, int col){
		DecimalFormat df = new DecimalFormat();
		DecimalFormatSymbols sym = new DecimalFormatSymbols();
		sym.setDecimalSeparator(',');
		sym.setGroupingSeparator(' ');
		df.setDecimalFormatSymbols(sym);
		double data = -1;
		for (TableRow tr : maut.getRows()){
			for (TreeNode node : getAllNodes()){
				if (node.getName().equals(tr.getCell(0).getValue())){
					try{
						data = Double.parseDouble(tr.getCell(col).getValue());
					} catch (NumberFormatException e){
						try {
							data = df.parse(tr.getCell(col).getValue()).doubleValue();
						} catch (ParseException e1) {
							e1.printStackTrace();
						}
					}
					node.setData(data);
					break;
				}
			}
		}
	}
	
	public void cleanNames(){
		for (TreeNode node : getAllNodes()){
			node.cleanName();
		}
	}
	public List<TreeNode> getAllNodes(){
		return this.root.getAllNodes();
	}
	public List<TreeNode> getLeafNodes(){
		return this.root.getLeafNodes();
	}
	
	public boolean isDataComplete(){
		List<TreeNode> nodes = getLeafNodes();
		boolean dataComplete = true;
		for (TreeNode node : nodes){
			if (node.getData() == -1){
				dataComplete = false;
				break;
			}
		}
		return dataComplete;
	}
	public double calculateValue(){
		return this.root.calculateValue();
	}
	public String toString(){
		return root.toString();
	}
}