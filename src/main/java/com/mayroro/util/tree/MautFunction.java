package com.mayroro.util.tree;

import java.util.Set;
import java.util.SortedMap;
import java.util.TreeMap;

public class MautFunction implements MautValue {
	private SortedMap<Double, Double> function;
	
	public MautFunction(){
		SortedMap<Double, Double> values = new TreeMap<Double, Double>();
		for (int i = 1; i<21; i++)
			values.put((double)i, 0.0);
		this.setFunction(values);
	}
	public MautFunction(SortedMap<Double, Double> values){
		this.setFunction(values);
	}

	public SortedMap<Double, Double> getFunction() {
		return function;
	}
	public void setFunction(SortedMap<Double, Double> function) {
		this.function = function;
	}
	
	@Override
	public double calculateValue(double data) {
		if (function.containsKey(data))
			return function.get(data);
		
		Set<Double> keySet = function.keySet();
		
		Double prevValue, nextValue, k, n, result = -1.0;
		prevValue = function.firstKey();
		
		for (Double key : keySet){
			nextValue = key;
			if (data > prevValue && data < nextValue){
				k = (function.get(nextValue)-function.get(prevValue))/(nextValue-prevValue);
				n = function.get(nextValue)-k*nextValue;
				result = k*data+n;
				break;
			}
			else {
				prevValue = key;
			}
		}
		return result;
	}
}
