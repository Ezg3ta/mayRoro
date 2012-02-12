<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>mautit</title>
<link charset="utf-8" rel="stylesheet" href="style/style.css" type="text/css" />
<link charset="utf-8" rel="stylesheet" href="style/jqplot.css" type="text/css" />
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js"></script>
<script type="text/javascript" src="script/custom.js"></script>
<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript" src="script/jquery.jqplot.min.js"></script>
<script type="text/javascript" src="script/plugins/allinone.js"></script>

<script>

google.load('visualization', '1', {packages:['orgchart', 'table']});

$(document).ready(function() {
    
    $("#board").boardbox();
    
});

function _getVal(str){
	return str.substring(0, str.indexOf("p"));
}
</script>


<script>

//global vars
var mautModel;
var data = new google.visualization.DataTable();
var newNodeId; // id of new node
var currentNode;
var currentNodeObject;
var nodeRowIndex;
var previousNode;

var nodesIds = new Array();
var nodesData = new Array();
var currentNodeIndex;
var currentItem;

var plot;

var defaultCoords = [[1,0.5],[2,0.5],[3,0.5],[4, 0.5],[5, 0.5],[6, 0.5],[7, 0.5],[8, 0.5],[9, 0.5],[10, 0.5],[11, 0.5],[12, 0.5],[13, 0.5],[14, 0.5],[15, 0.5],[16, 0.5],[17, 0.5],[18, 0.5],[19, 0.5],[20, 0.5]];

//toolbar

$(window).resize(function() {
	if($(".toolbar").css("visibility") == "visible")
		positionToolbar(currentNodeObject);
}).change();

function positionToolbar(obj){
	$(".toolbar").css("visibility", "visible");
	var top = obj.offset().top + obj.outerHeight() + 8;
	var left = obj.offset().left +((obj.outerWidth() - $(".toolbar").outerWidth())/2);
	$(".toolbar").css("top", top+"px");
	$(".toolbar").css("left", left+"px");
}
function hideToolbar(){
	$(".toolbar").css("visibility", "hidden");
}
</script>

<script>

/**
*	graph code
*/

//class
function GraphData(name, nodeId, pointCoords, min, max){
	this.name = ""+name;
	this.nodeId = nodeId;
	this.pointCoords = pointCoords; //[[1,0],[2,0.25],[3,0.5],[4, 1]];
	this.min = min;
	this.max = max;
}

function initNodesIds(){
	var nodesName = new Array();
	$(".google-visualization-orgchart-node-medium").each(function(index, element) {
        _nodeId = $(this).children("input").attr("nodeId");
		_nodeName = $(this).children("input").attr("value");
		nodesIds[index] = _nodeId;
		nodesName[index] = _nodeName;
    });
	
	for(i = 0; i < nodesIds.length; i++){
		
		coords = defaultCoords;
		
		nodesData[i] = new GraphData(nodesName[i], nodesIds[i], coords, 1, 20);
	}
	
	nodesIdsSorted = nodesIds.sort();
	
	newNodeId = parseInt(nodesIdsSorted[nodesIds.length - 1]) + 1;
}
	
function initUtilityGraph(name, pointCoords, min, max){

  $.jqplot.config.enablePlugins = true;
  plot = $.jqplot('utilityGraph',[pointCoords],{
	 title: 'Funkcija koristnosti: <b>'+name+'</b>',
	 seriesDefaults: {
		  shadow: false,
		trendline: {
			show: false
		}
	 },
	 axes: {
		 xaxis: {
			 min: min,
			 max: max,
			 numberTicks: 10,
			 tickOptions: {
			 	formatString: '%.2f'
			 }
		 },
		 yaxis: {
			 min: 0,
			max: 1,
			 numberTicks: 5
		 }
	 },
	 highlighter: {
		 sizeAdjust: 10,
		 tooltipLocation: 'n',
		 tooltipAxes: 'y',
		 tooltipFormatString: '<b><i><span style="color:#666;">koristnost</span></i></b> %.2f',
		 useAxesFormatters: false
	 },
	 cursor: {
		 show: true
	 },
	  grid: {
		  shadow: false
	  }
  });

}


</script>

<script>

	/*	popup	*/
	
	function showPopup(name, pointCoords, min, max){
			$(".popup").css("display","block");
			initUtilityGraph(name, pointCoords, min, max);
	}
	
	function hidePopup(){
			$(".popup").css("display","none");
	}
	
	$(".closePopup").live("click", function(){
		hidePopup();
		nodesData[currentNodeIndex].pointCoords = plot.series[0].data;
		plot.destroy();
	});
	
</script>

<script>

$(".google-visualization-orgchart-node").live("mousedown", function(){
	if(currentNode != undefined){
		currentNodeObject = $(this); 
		positionToolbar(currentNodeObject);
	}
	else{
		hideToolbar();
	}
		
});

$(".mainNav").live("click", function(){
  $(".toolbar").css("visibility", "hidden");
  mautModel.setSelection();
});


function _getCurrentNodeIndex(){
	id = currentNodeObject.children("input").attr("nodeid");
	for(i = 0; i < nodesData.length; i++){
		if(id == nodesData[i].nodeId){
			currentNodeIndex = i;
			showPopup(nodesData[i].name, nodesData[i].pointCoords, nodesData[i].min, nodesData[i].max);
			break;
		}
	}
}



/* triggeri */
$(".addModelNode").live("click", function(){
	data.addRow(['<input type="text" value="'+(newNodeId)+'" nodeid="'+(newNodeId)+'"/>', currentNode]);
	mautModel.draw(data, {allowHtml:true});
	mautModel.setSelection();
	hideToolbar();
	
	_node = new GraphData(newNodeId, newNodeId, defaultCoords, 1, 20);
	nodesData[nodesData.length] = _node; 
	
	nodesIds[nodesIds.length] = newNodeId;
	
	newNodeId++;
  
});

$(".deleteModelNode").live("click", function(){
	data.removeRow(nodeRowIndex);
	mautModel.draw(data, {allowHtml:true});
	mautModel.setSelection();
	
	hideToolbar();
  
});

$(".functionModelNode").live("click", function(){
	i = _getCurrentNodeIndex();
	showPopup(nodesData[i].name, nodesData[i].pointCoords, nodesData[i].min, nodesData[i].max);
});

$(".google-visualization-orgchart-node input").live("focusin", function(){
	//alert(currentNodeIndex);
});

$(".google-visualization-orgchart-node input").live("focusout", function(){
	_val = $(this).attr("value");
	//alert(currentNodeIndex);
	//alert(nodesData[currentNodeIndex].name);
	nodesData[currentNodeIndex].name = _val;	
	
	_rowIndex = nodeItem.row;
	
	data.setValue(_rowIndex, 0, _val);
	mautModel.draw(data, {allowHtml:true});
	mautModel.setSelection();
	
});

</script>
    
    
</head>

<body>
	
    <div id="top">
    Pozdravljen ${userInfo.name}!<br /><br />
<c:forEach var="spreadsheet" items="${spreadsheets}">
	<c:out value="${spreadsheet.title.plainText}" /><br />
</c:forEach>
    </div>
    
    <div class="mainNav" id="leftNav">
    	<div class="btn blueGrad">model</div><br />
        <div class="btn greenGrad">alternative</div><br />
        <div class="btn yellowGrad">rezultat</div>
    </div>
    
    <div id="toolbox">
    	<div class="line greenGrad">
        </div>
        <div class="icon50 save"></div><div class="iconInfo">shrani</div>
        <div class="icon50 saveVersion"></div><div class="iconInfo">verzioniraj</div>
        <div class="icon50 openVersion"></div><div class="iconInfo">odpri verzijo</div>
    </div>
    
    <div class="toolbar">
        <a class="deleteModelNode">&times;</a> <a class="addModelNode">+</a> <!-- <a>&uArr;</a> <a>&dArr;</a>--> <a class="functionModelNode">&fnof;</a>
    </div>
    
    <div id="board">
    <div id="slide">
        <div class="main">
        	<h1>Model</h1>

<script type="text/javascript">

function drawVisualization() {
  // To see the data that this visualization uses, browse to
  // http://spreadsheets.google.com/ccc?key=pCQbetd-CptGXxxQIG7VFIQ  
  var query = new google.visualization.Query(
	  'https://docs.google.com/spreadsheet/ccc?key=0AhhkkHUzjYDbdHFQdHRpMFBnektVb2ZNSVdKcDNvMVE&hl=en_US#gid=0');
  
  // Send the query with a callback function.
  query.send(handleQueryResponse);
}

function handleQueryResponse(response) {
	
	
	if (response.isError()) {
		alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
		return;
	}
	
	data = response.getDataTable();
	mautModel = new google.visualization.OrgChart(document.getElementById('chart_div'));
  
	google.visualization.events.addListener(mautModel, 'select', function() {
	  
		var selection = mautModel.getSelection();
		var item;
		for (var i = 0; i < selection.length; i++) {
			var str = '';
			item = selection[i];
			if (item.row != null && item.column != null) {
			  str = data.getFormattedValue(item.row, item.column);
			} else if (item.row != null) {
			  str = data.getFormattedValue(item.row, 0);
			} else if (item.column != null) {
			  str = data.getFormattedValue(0, item.column);
			}
		}
		
		previousNode = currentNode;
		currentNode = str;
		nodeRowIndex = item.row;
		currentItem = item;
		
		/*
		if(str != ''){
			data.addRow(['<input type="text" value="'+(nodeId++)+'"/>', str]);
			mautModel.draw(data, {allowHtml:true});
		}
		mautModel.setSelection();*/
	});
  
  
  mautModel.draw(data, {allowHtml:true});
  initNodesIds(); //get ids of nodes
}

google.setOnLoadCallback(drawVisualization);
</script>

            <div id="chart_div">
            </div>
        </div>
        <div class="main">
        	<h1>Alternative</h1>
            
        </div>
        <div class="main">
       		<h1>Rezultat</h1>
        </div>
    </div>
    </div>
    
    
    
    
    
    <div class="popup">
    	<div class="closePopup">&times;</div>
    	<div class="example-plot" id="utilityGraph"></div>  
    </div>
    
    
    
    
    
    
    <div id="bottomArea">
    	<div class="btmNav noteBtn"></div>
        <div class="btmNav helpBtn"></div>
        <div class="area">
            <div class="content">
            	<div class="close">&times;</div>
                <p>
                Although experts were initially skeptical, this condition is now recognized as a common disorder, with its prevalence in the U.S. ranging from 1.4 percent in Florida to 9.7 percent in New Hampshire.[3]
The U.S. National Library of Medicine notes that "some people experience a serious mood change when the seasons change. They may 
                </p>
            </div>
            <div class="arrow"></div>
        </div>
    </div>

</body>
</html>