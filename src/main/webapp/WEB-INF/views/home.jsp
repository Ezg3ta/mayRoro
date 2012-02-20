<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://www.springframework.org/tags/form" prefix="form"%>


<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>mayRoro</title>
<link charset="utf-8" rel="stylesheet" href="<c:out value="${pageContext.request.contextPath}" />/resources/style/style.css" type="text/css" />
<link charset="utf-8" rel="stylesheet" href="<c:out value="${pageContext.request.contextPath}" />/resources/style/jqplot.css" type="text/css" />
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js"></script>
<script type="text/javascript" src="<c:out value="${pageContext.request.contextPath}" />/resources/script/custom.js"></script>
<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript" src="<c:out value="${pageContext.request.contextPath}" />/resources/script/jquery.jqplot.min.js"></script>
<script type="text/javascript" src="<c:out value="${pageContext.request.contextPath}" />/resources/script/plugins/allinone.js"></script>

<script>

google.load('visualization', '1', {packages:['orgchart', 'table']});

$(document).ready(function() {
    
    $("#board").boardbox();
    
});

function _getVal(str){
	return str.substring(0, str.indexOf("p"));
}

function _create2DArray(rows) {
  var arr = [];

  for (var i=0;i<rows;i++) {
     arr[i] = [];
  }

  return arr;
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
var alternatives = new Array();
var currentNodeIndex;
var currentItem;

var spreadsheetHref = "${spreadsheet.htmlLink.href}";
var spreadsheetKey = "${spreadsheet.key}";

var plot;

var defaultCoords = [[1,0.5],[2,0.5],[3,0.5],[4, 0.5],[5, 0.5],[6, 0.5],[7, 0.5],[8, 0.5],[9, 0.5],[10, 0.5],[11, 0.5],[12, 0.5],[13, 0.5],[14, 0.5],[15, 0.5],[16, 0.5],[17, 0.5],[18, 0.5],[19, 0.5],[20, 0.5]];

var tableData = new google.visualization.DataTable();
var initedTable = false;
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



function _getNodeIndex(){
	id = currentNodeObject.children("input").attr("nodeid");
	for(i = 0; i < nodesData.length; i++){
		if(id == nodesData[i].nodeId){
			break;
		}
	}
	return i;
	
}

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
	data.addRow(['<input type="text" value="'+(newNodeId)+'" nodeid="'+(newNodeId)+'"/>', currentNode, 0]);
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



/*  					*/
var nodeVal;

$(".google-visualization-orgchart-node input").live("focusin", function(){
	nodeVal = $(this).attr("value");
});

$(".google-visualization-orgchart-node input").live("focusout", function(){
	_val = $(this).attr("value");
	
	n = _getNodeIndex();
	//alert(currentNodeIndex);
	//alert(nodesData[currentNodeIndex].name);
	nodesData[n].name = _val;	
	
	for(i = 0; i < data.getNumberOfRows(); i++){
		
		for(j = 0; j < data.getNumberOfColumns() - 1; j++){
			_s = data.getValue(i,j);
			
			if(_s.indexOf(nodeVal) >= 0){
				_d = _s.replace(nodeVal, _val);
				data.setCell(i,j,_d);
			}
		}
		
	}
	mautModel.draw(data, {allowHtml:true});
	mautModel.setSelection();
	
});

$(".greenGrad").live("click", function(){
	fillTable();
});

$(".addAlternative").live("click", function(){
	val = $("#alternativeName").attr("value");
	if(val.length >= 2){
		$("#alternativeName").attr("value","");
		tableData.addColumn("string", val );
		drawTable();
	}
});

$(".tblInput").live("focusout", function(){
	
	row = parseInt($(this).attr("row"));
	col = parseInt($(this).attr("col"));
	val = $(this).attr("value");
	
	tableData.setCell(row, col, val);
	drawTable();
});


$(".logout").live("click", function(){
	$.get("logout");
	$.get("https://accounts.google.com/Logout");
	return false;
	
});


$(".save").live("click", function(){
	$.post(
		"<c:out value="${pageContext.request.contextPath}" />/util/save", 
		{drevo: data.toJSON(), funkcije: "asd", maut: tableData.toJSON(), key: spreadsheetKey},
		function(a) {
		   alert(a);
		}
	);
	
});


</script>
    
    
</head>

<body>
	
    <div id="top">
    <div class="content">
    
    	<div class="logo">mayRoro</div>
        <div class="logout">logout</div>
        <div class="user">${userInfo.name}</div>
       
        <div class="menu">
        
        	<div class="btnM">Projekti</div>
            <div class="btnM">Pomoč</div>
            <div class="btnM">Kontakt</div>
            
        </div>
        
        
    </div>
    </div>
    
    
    <div id="board">
    
    <h1>Seznam projektov </h1><br/><br/>
    
    <c:forEach var="spreadsheet" items="${spreadsheets}">
      <a href="<c:out value="maut/${spreadsheet.key}" />"><c:out value="${spreadsheet.title.plainText}" /></a><br />
    </c:forEach>
    
    <br/><br/><br/>
    
    <h1>Ustvari nov projekt</h1><br/><br/>
    
    
    <form method="get" action="/mayRoro/util/new_spreadsheet"> 
	    <input name="title" type="text"/>
	    <input type="submit" title="ustvari"/>
    </form>
    
    


</body>
</html>