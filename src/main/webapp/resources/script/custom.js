// JavaScript Document
// author: mayRoro

;(function($) {
	
	var n;
	var current = 1;
	var previous = 1;
	var width;
	
	_getVal = function(str){
		return str.substring(0, str.indexOf("p"));
	}
		
	$.fn.boardbox = function(options) {
		
		n = $(".main").size();
		width = _getVal($(".main").css("width"));
		$("#slide").css("width",(n * width) + "px");
	};

	$.boardbox = function(obj) {};

	$.boardbox.init = function() {
		
		$(".main").css("width", $("#board").css("width"));
		
		$(".main").each(function(index, element) {
            $(this).attr("value", (index+1));
        });
		$(".btn").each(function(index, element) {
            $(this).attr("value", (index+1));
        });
		
		$(window).resize(function() {
			width = _getVal($("#board").css("width"));
			$(".main").css("width", width);
			$("#slide").css("width",(n * width) + "px");
			$("#slide").css("left", (-(current-1)*width)+"px");
        }).change();
		
		$(".mainNav .btn").click(function(e) {
			current = $(this).attr("value");
			$(".main").css("visibility", "visible");
			if(current > previous){
				x = current - previous;
				$("#slide").animate({"left": "-="+x*width+"px"}, "slow", function(){
					$(".main").css("visibility", "hidden");
            		$(".main:nth-child("+current+")").css("visibility", "visible");
				});
				previous = current;
			}
			else if(current < previous){
				x = previous - current;
				$("#slide").animate({"left": "+="+x*width+"px"}, "slow", function(){
					$(".main").css("visibility", "hidden");
            		$(".main:nth-child("+current+")").css("visibility", "visible");
				});
				previous = current;
			}

        });
		
	}
		
	$(document).ready(function() {
		$.boardbox.init();
	});

})(jQuery);