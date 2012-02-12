/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.0b2_r1012
 *
 * Copyright (c) 2009-2011 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 * 
 */
(function($) {
    
    /**
     * Class: $.jqplot.Dragable
     * Plugin to make plotted points dragable by the user.
     */
    $.jqplot.Dragable = function(options) {
        // Group: Properties
        this.markerRenderer = new $.jqplot.MarkerRenderer({shadow:false});
        this.shapeRenderer = new $.jqplot.ShapeRenderer();
        this.isDragging = false;
        this.isOver = false;
        this._ctx;
        this._elem;
        this._point;
        this._gridData;
        // prop: color
        // CSS color spec for the dragged point (and adjacent line segment or bar).
        this.color;
        // prop: constrainTo
        // Constrain dragging motion to an axis or to none.
        // Allowable values are 'none', 'x', 'y'
        this.constrainTo = 'y';  // 'x', 'y', or 'none';
        $.extend(true, this, options);
    };
    
    function DragCanvas() {
        $.jqplot.GenericCanvas.call(this);
        this.isDragging = false;
        this.isOver = false;
        this._neighbor;
        this._cursors = [];
    }
    
    DragCanvas.prototype = new $.jqplot.GenericCanvas();
    DragCanvas.prototype.constructor = DragCanvas;
    
    
    // called within scope of series
    $.jqplot.Dragable.parseOptions = function (defaults, opts) {
        var options = opts || {};
        this.plugins.dragable = new $.jqplot.Dragable(options.dragable);
        // since this function is called before series options are parsed,
        // we can set this here and it will be overridden if needed.
        this.isDragable = $.jqplot.config.enablePlugins;
    };
    
    // called within context of plot
    // create a canvas which we can draw on.
    // insert it before the eventCanvas, so eventCanvas will still capture events.
    // add a new DragCanvas object to the plot plugins to handle drawing on this new canvas.
    $.jqplot.Dragable.postPlotDraw = function() {
        // Memory Leaks patch    
        if (this.plugins.dragable && this.plugins.dragable.highlightCanvas) {
            this.plugins.dragable.highlightCanvas.resetCanvas();
            this.plugins.dragable.highlightCanvas = null;
        }

        this.plugins.dragable = {previousCursor:'auto', isOver:false};
        this.plugins.dragable.dragCanvas = new DragCanvas();
        
        this.eventCanvas._elem.before(this.plugins.dragable.dragCanvas.createElement(this._gridPadding, 'jqplot-dragable-canvas', this._plotDimensions, this));
        var dctx = this.plugins.dragable.dragCanvas.setContext();
    };
    
    //$.jqplot.preInitHooks.push($.jqplot.Dragable.init);
    $.jqplot.preParseSeriesOptionsHooks.push($.jqplot.Dragable.parseOptions);
    $.jqplot.postDrawHooks.push($.jqplot.Dragable.postPlotDraw);
    $.jqplot.eventListenerHooks.push(['jqplotMouseMove', handleMove]);
    $.jqplot.eventListenerHooks.push(['jqplotMouseDown', handleDown]);
    $.jqplot.eventListenerHooks.push(['jqplotMouseUp', handleUp]);

    
    function initDragPoint(plot, neighbor) {
        var s = plot.series[neighbor.seriesIndex];
        var drag = s.plugins.dragable;
        
        // first, init the mark renderer for the dragged point
        var smr = s.markerRenderer;
        var mr = drag.markerRenderer;
        mr.style = smr.style;
        mr.lineWidth = smr.lineWidth + 2.5;
        mr.size = smr.size + 5;
        if (!drag.color) {
            var rgba = $.jqplot.getColorComponents(smr.color);
            var newrgb = [rgba[0], rgba[1], rgba[2]];
            var alpha = (rgba[3] >= 0.6) ? rgba[3]*0.6 : rgba[3]*(2-rgba[3]);
            drag.color = 'rgba('+newrgb[0]+','+newrgb[1]+','+newrgb[2]+','+alpha+')';
        }
        mr.color = drag.color;
        mr.init();

        var start = (neighbor.pointIndex > 0) ? neighbor.pointIndex - 1 : 0;
        var end = neighbor.pointIndex+2;
        drag._gridData = s.gridData.slice(start, end);
    }
    
    function handleMove(ev, gridpos, datapos, neighbor, plot) {
        if (plot.plugins.dragable.dragCanvas.isDragging) {
            var dc = plot.plugins.dragable.dragCanvas;
            var dp = dc._neighbor;
            var s = plot.series[dp.seriesIndex];
            var drag = s.plugins.dragable;
            var gd = s.gridData;
            
            // compute the new grid position with any constraints.
            var x = (drag.constrainTo == 'y') ? dp.gridData[0] : gridpos.x;
            var y = (drag.constrainTo == 'x') ? dp.gridData[1] : gridpos.y;
            
            // compute data values for any listeners.
            var xu = s._xaxis.series_p2u(x);
            var yu = s._yaxis.series_p2u(y);
            
            // clear the canvas then redraw effect at new position.
            var ctx = dc._ctx;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // adjust our gridData for the new mouse position
            if (dp.pointIndex > 0) {
                drag._gridData[1] = [x, y];
            }
            else {
                drag._gridData[0] = [x, y];
            }
            plot.series[dp.seriesIndex].draw(dc._ctx, {gridData:drag._gridData, shadow:false, preventJqPlotSeriesDrawTrigger:true, color:drag.color, markerOptions:{color:drag.color, shadow:false}, trendline:{show:false}});
            plot.target.trigger('jqplotSeriesPointChange', [dp.seriesIndex, dp.pointIndex, [xu,yu], [x,y]]);
        }
        else if (neighbor != null) {
            var series = plot.series[neighbor.seriesIndex];
            if (series.isDragable) {
                var dc = plot.plugins.dragable.dragCanvas;
                if (!dc.isOver) {
                    dc._cursors.push(ev.target.style.cursor);
                    ev.target.style.cursor = "pointer";
                }
                dc.isOver = true;
            }
        }
        else if (neighbor == null) {
            var dc = plot.plugins.dragable.dragCanvas;
            if (dc.isOver) {
                ev.target.style.cursor = dc._cursors.pop();
                dc.isOver = false;
            }
        }
    }
    
    function handleDown(ev, gridpos, datapos, neighbor, plot) {
        var dc = plot.plugins.dragable.dragCanvas;
        dc._cursors.push(ev.target.style.cursor);
        if (neighbor != null) {
            var s = plot.series[neighbor.seriesIndex];
            var drag = s.plugins.dragable;
            if (s.isDragable && !dc.isDragging) {
                dc._neighbor = neighbor;
                dc.isDragging = true;
                initDragPoint(plot, neighbor);
                drag.markerRenderer.draw(s.gridData[neighbor.pointIndex][0], s.gridData[neighbor.pointIndex][1], dc._ctx);
                ev.target.style.cursor = "corsair";
                plot.target.trigger('jqplotDragStart', [neighbor.seriesIndex, neighbor.pointIndex, gridpos, datapos]);
            }
        }
        // Just in case of a hickup, we'll clear the drag canvas and reset.
        else {
           var ctx = dc._ctx;
           ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
           dc.isDragging = false;
        }
    }
    
    function handleUp(ev, gridpos, datapos, neighbor, plot) {
        if (plot.plugins.dragable.dragCanvas.isDragging) {
            var dc = plot.plugins.dragable.dragCanvas;
            // clear the canvas
            var ctx = dc._ctx;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            dc.isDragging = false;
            // redraw the series canvas at the new point.
            var dp = dc._neighbor;
            var s = plot.series[dp.seriesIndex];
            var drag = s.plugins.dragable;
            // compute the new grid position with any constraints.
            var x = (drag.constrainTo == 'y') ? dp.data[0] : datapos[s.xaxis];
            var y = (drag.constrainTo == 'x') ? dp.data[1] : datapos[s.yaxis];
            // var x = datapos[s.xaxis];
            // var y = datapos[s.yaxis];
            s.data[dp.pointIndex][0] = x;
            s.data[dp.pointIndex][1] = y;
            plot.drawSeries({preventJqPlotSeriesDrawTrigger:true}, dp.seriesIndex);
            dc._neighbor = null;
            ev.target.style.cursor = dc._cursors.pop();
            plot.target.trigger('jqplotDragStop', [gridpos, datapos]);
        }
    }
})(jQuery);





























// JavaScript Document
/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.0b2_r1012
 *
 * Copyright (c) 2009-2011 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 * included jsDate library by Chris Leonello:
 *
 * Copyright (c) 2010-2011 Chris Leonello
 *
 * jsDate is currently available for use in all personal or commercial projects 
 * under both the MIT and GPL version 2.0 licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly.
 *
 * jsDate borrows many concepts and ideas from the Date Instance 
 * Methods by Ken Snyder along with some parts of Ken's actual code.
 * 
 * Ken's origianl Date Instance Methods and copyright notice:
 * 
 * Ken Snyder (ken d snyder at gmail dot com)
 * 2008-09-10
 * version 2.0.2 (http://kendsnyder.com/sandbox/date/)     
 * Creative Commons Attribution License 3.0 (http://creativecommons.org/licenses/by/3.0/)
 *
 * jqplotToImage function based on Larry Siden's export-jqplot-to-png.js.
 * Larry has generously given permission to adapt his code for inclusion
 * into jqPlot.
 *
 * Larry's original code can be found here:
 *
 * https://github.com/lsiden/export-jqplot-to-png
 * 
 * 
 */
(function(d){d.jqplot.eventListenerHooks.push(["jqplotMouseMove",f]);d.jqplot.Highlighter=function(h){this.show=d.jqplot.config.enablePlugins;this.markerRenderer=new d.jqplot.MarkerRenderer({shadow:false});this.showMarker=true;this.lineWidthAdjust=2.5;this.sizeAdjust=5;this.showTooltip=true;this.tooltipLocation="nw";this.fadeTooltip=true;this.tooltipFadeSpeed="fast";this.tooltipOffset=2;this.tooltipAxes="both";this.tooltipSeparator=", ";this.tooltipContentEditor=null;this.useAxesFormatters=true;this.tooltipFormatString="%.5P";this.formatString=null;this.yvalues=1;this.bringSeriesToFront=false;this._tooltipElem;this.isHighlighting=false;this.currentNeighbor=null;d.extend(true,this,h)};var b=["nw","n","ne","e","se","s","sw","w"];var e={nw:0,n:1,ne:2,e:3,se:4,s:5,sw:6,w:7};var c=["se","s","sw","w","nw","n","ne","e"];d.jqplot.Highlighter.init=function(k,j,i){var h=i||{};this.plugins.highlighter=new d.jqplot.Highlighter(h.highlighter)};d.jqplot.Highlighter.parseOptions=function(i,h){this.showHighlight=true};d.jqplot.Highlighter.postPlotDraw=function(){if(this.plugins.highlighter&&this.plugins.highlighter.highlightCanvas){this.plugins.highlighter.highlightCanvas.resetCanvas();this.plugins.highlighter.highlightCanvas=null}if(this.plugins.highlighter&&this.plugins.highlighter._tooltipElem){this.plugins.highlighter._tooltipElem.emptyForce();this.plugins.highlighter._tooltipElem=null}this.plugins.highlighter.highlightCanvas=new d.jqplot.GenericCanvas();this.eventCanvas._elem.before(this.plugins.highlighter.highlightCanvas.createElement(this._gridPadding,"jqplot-highlight-canvas",this._plotDimensions,this));this.plugins.highlighter.highlightCanvas.setContext();var h=document.createElement("div");this.plugins.highlighter._tooltipElem=d(h);h=null;this.plugins.highlighter._tooltipElem.addClass("jqplot-highlighter-tooltip");this.plugins.highlighter._tooltipElem.css({position:"absolute",display:"none"});this.eventCanvas._elem.before(this.plugins.highlighter._tooltipElem)};d.jqplot.preInitHooks.push(d.jqplot.Highlighter.init);d.jqplot.preParseSeriesOptionsHooks.push(d.jqplot.Highlighter.parseOptions);d.jqplot.postDrawHooks.push(d.jqplot.Highlighter.postPlotDraw);function a(m,o){var j=m.plugins.highlighter;var p=m.series[o.seriesIndex];var h=p.markerRenderer;var i=j.markerRenderer;i.style=h.style;i.lineWidth=h.lineWidth+j.lineWidthAdjust;i.size=h.size+j.sizeAdjust;var l=d.jqplot.getColorComponents(h.color);var n=[l[0],l[1],l[2]];var k=(l[3]>=0.6)?l[3]*0.6:l[3]*(2-l[3]);i.color="rgba("+n[0]+","+n[1]+","+n[2]+","+k+")";i.init();i.draw(p.gridData[o.pointIndex][0],p.gridData[o.pointIndex][1],j.highlightCanvas._ctx)}function g(A,q,m){var k=A.plugins.highlighter;var D=k._tooltipElem;var r=q.highlighter||{};var t=d.extend(true,{},k,r);if(t.useAxesFormatters){var w=q._xaxis._ticks[0].formatter;var h=q._yaxis._ticks[0].formatter;var E=q._xaxis._ticks[0].formatString;var s=q._yaxis._ticks[0].formatString;var z;var u=w(E,m.data[0]);var l=[];for(var B=1;B<t.yvalues+1;B++){l.push(h(s,m.data[B]))}if(typeof t.formatString==="string"){switch(t.tooltipAxes){case"both":case"xy":l.unshift(u);l.unshift(t.formatString);z=d.jqplot.sprintf.apply(d.jqplot.sprintf,l);break;case"yx":l.push(u);l.unshift(t.formatString);z=d.jqplot.sprintf.apply(d.jqplot.sprintf,l);break;case"x":z=d.jqplot.sprintf.apply(d.jqplot.sprintf,[t.formatString,u]);break;case"y":l.unshift(t.formatString);z=d.jqplot.sprintf.apply(d.jqplot.sprintf,l);break;default:l.unshift(u);l.unshift(t.formatString);z=d.jqplot.sprintf.apply(d.jqplot.sprintf,l);break}}else{switch(t.tooltipAxes){case"both":case"xy":z=u;for(var B=0;B<l.length;B++){z+=t.tooltipSeparator+l[B]}break;case"yx":z="";for(var B=0;B<l.length;B++){z+=l[B]+t.tooltipSeparator}z+=u;break;case"x":z=u;break;case"y":z=l.join(t.tooltipSeparator);break;default:z=u;for(var B=0;B<l.length;B++){z+=t.tooltipSeparator+l[B]}break}}}else{var z;if(typeof t.formatString==="string"){z=d.jqplot.sprintf.apply(d.jqplot.sprintf,[t.formatString].concat(m.data))}else{if(t.tooltipAxes=="both"||t.tooltipAxes=="xy"){z=d.jqplot.sprintf(t.tooltipFormatString,m.data[0])+t.tooltipSeparator+d.jqplot.sprintf(t.tooltipFormatString,m.data[1])}else{if(t.tooltipAxes=="yx"){z=d.jqplot.sprintf(t.tooltipFormatString,m.data[1])+t.tooltipSeparator+d.jqplot.sprintf(t.tooltipFormatString,m.data[0])}else{if(t.tooltipAxes=="x"){z=d.jqplot.sprintf(t.tooltipFormatString,m.data[0])}else{if(t.tooltipAxes=="y"){z=d.jqplot.sprintf(t.tooltipFormatString,m.data[1])}}}}}}if(d.isFunction(t.tooltipContentEditor)){z=t.tooltipContentEditor(z,m.seriesIndex,m.pointIndex,A)}D.html(z);var C={x:m.gridData[0],y:m.gridData[1]};var v=0;var j=0.707;if(q.markerRenderer.show==true){v=(q.markerRenderer.size+t.sizeAdjust)/2}var o=b;if(q.fillToZero&&q.fill&&m.data[1]<0){o=c}switch(o[e[t.tooltipLocation]]){case"nw":var p=C.x+A._gridPadding.left-D.outerWidth(true)-t.tooltipOffset-j*v;var n=C.y+A._gridPadding.top-t.tooltipOffset-D.outerHeight(true)-j*v;break;case"n":var p=C.x+A._gridPadding.left-D.outerWidth(true)/2;var n=C.y+A._gridPadding.top-t.tooltipOffset-D.outerHeight(true)-v;break;case"ne":var p=C.x+A._gridPadding.left+t.tooltipOffset+j*v;var n=C.y+A._gridPadding.top-t.tooltipOffset-D.outerHeight(true)-j*v;break;case"e":var p=C.x+A._gridPadding.left+t.tooltipOffset+v;var n=C.y+A._gridPadding.top-D.outerHeight(true)/2;break;case"se":var p=C.x+A._gridPadding.left+t.tooltipOffset+j*v;var n=C.y+A._gridPadding.top+t.tooltipOffset+j*v;break;case"s":var p=C.x+A._gridPadding.left-D.outerWidth(true)/2;var n=C.y+A._gridPadding.top+t.tooltipOffset+v;break;case"sw":var p=C.x+A._gridPadding.left-D.outerWidth(true)-t.tooltipOffset-j*v;var n=C.y+A._gridPadding.top+t.tooltipOffset+j*v;break;case"w":var p=C.x+A._gridPadding.left-D.outerWidth(true)-t.tooltipOffset-v;var n=C.y+A._gridPadding.top-D.outerHeight(true)/2;break;default:var p=C.x+A._gridPadding.left-D.outerWidth(true)-t.tooltipOffset-j*v;var n=C.y+A._gridPadding.top-t.tooltipOffset-D.outerHeight(true)-j*v;break}D.css("left",p);D.css("top",n);if(t.fadeTooltip){D.stop(true,true).fadeIn(t.tooltipFadeSpeed)}else{D.show()}D=null}function f(k,j,n,m,l){var h=l.plugins.highlighter;var o=l.plugins.cursor;if(h.show){if(m==null&&h.isHighlighting){var i=h.highlightCanvas._ctx;i.clearRect(0,0,i.canvas.width,i.canvas.height);if(h.fadeTooltip){h._tooltipElem.fadeOut(h.tooltipFadeSpeed)}else{h._tooltipElem.hide()}if(h.bringSeriesToFront){l.restorePreviousSeriesOrder()}h.isHighlighting=false;h.currentNeighbor=null;i=null}else{if(m!=null&&l.series[m.seriesIndex].showHighlight&&!h.isHighlighting){h.isHighlighting=true;h.currentNeighbor=m;if(h.showMarker){a(l,m)}if(h.showTooltip&&(!o||!o._zoom.started)){g(l,l.series[m.seriesIndex],m)}if(h.bringSeriesToFront){l.moveSeriesToFront(m.seriesIndex)}}else{if(m!=null&&h.isHighlighting&&h.currentNeighbor!=m){if(l.series[m.seriesIndex].showHighlight){var i=h.highlightCanvas._ctx;i.clearRect(0,0,i.canvas.width,i.canvas.height);h.isHighlighting=true;h.currentNeighbor=m;if(h.showMarker){a(l,m)}if(h.showTooltip&&(!o||!o._zoom.started)){g(l,l.series[m.seriesIndex],m)}if(h.bringSeriesToFront){l.moveSeriesToFront(m.seriesIndex)}}}}}}}})(jQuery);




/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.0b2_r1012
 *
 * Copyright (c) 2009-2011 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 * included jsDate library by Chris Leonello:
 *
 * Copyright (c) 2010-2011 Chris Leonello
 *
 * jsDate is currently available for use in all personal or commercial projects 
 * under both the MIT and GPL version 2.0 licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly.
 *
 * jsDate borrows many concepts and ideas from the Date Instance 
 * Methods by Ken Snyder along with some parts of Ken's actual code.
 * 
 * Ken's origianl Date Instance Methods and copyright notice:
 * 
 * Ken Snyder (ken d snyder at gmail dot com)
 * 2008-09-10
 * version 2.0.2 (http://kendsnyder.com/sandbox/date/)     
 * Creative Commons Attribution License 3.0 (http://creativecommons.org/licenses/by/3.0/)
 *
 * jqplotToImage function based on Larry Siden's export-jqplot-to-png.js.
 * Larry has generously given permission to adapt his code for inclusion
 * into jqPlot.
 *
 * Larry's original code can be found here:
 *
 * https://github.com/lsiden/export-jqplot-to-png
 * 
 * 
 */
(function(f){f.jqplot.Trendline=function(){this.show=f.jqplot.config.enablePlugins;this.color="#666666";this.renderer=new f.jqplot.LineRenderer();this.rendererOptions={marker:{show:false}};this.label="";this.type="linear";this.shadow=true;this.markerRenderer={show:false};this.lineWidth=1.5;this.shadowAngle=45;this.shadowOffset=1;this.shadowAlpha=0.07;this.shadowDepth=3;this.isTrendline=true};f.jqplot.postSeriesInitHooks.push(e);f.jqplot.postDrawSeriesHooks.push(g);f.jqplot.addLegendRowHooks.push(a);function a(k){var j=null;if(k.trendline&&k.trendline.show){var i=k.trendline.label.toString();if(i){j={label:i,color:k.trendline.color}}}return j}function e(m,k,j,i,l){if(this._type&&(this._type==="line"||this._type=="bar")){this.trendline=new f.jqplot.Trendline();i=i||{};f.extend(true,this.trendline,{color:this.color},j.trendline,i.trendline);this.trendline.renderer.init.call(this.trendline,null)}}function g(m,i){i=f.extend(true,{},this.trendline,i);if(this.trendline&&i.show){var k;var l=i.data||this.data;k=c(l,this.trendline.type);var j=i.gridData||this.renderer.makeGridData.call(this,k.data);this.trendline.renderer.draw.call(this.trendline,m,j,{showLine:true,shadow:this.trendline.shadow})}}function b(w,v,n){var u=(n==null)?"linear":n;var s=w.length;var t;var z;var o=0;var m=0;var r=0;var q=0;var l=0;var j=[];var k=[];if(u=="linear"){k=w;j=v}else{if(u=="exp"||u=="exponential"){for(var p=0;p<v.length;p++){if(v[p]<=0){s--}else{k.push(w[p]);j.push(Math.log(v[p]))}}}}for(var p=0;p<s;p++){o=o+k[p];m=m+j[p];q=q+k[p]*j[p];r=r+k[p]*k[p];l=l+j[p]*j[p]}t=(s*q-o*m)/(s*r-o*o);z=(m-t*o)/s;return[t,z]}function h(k,j){var i;i=b(k,j,"linear");return[i[0],i[1]]}function d(o,m){var k;var i=o;var n=m;k=b(i,n,"exp");var l=Math.exp(k[0]);var j=Math.exp(k[1]);return[l,j]}function c(l,j){var p=(j==null)?"linear":j;var n;var o;var r=[];var q=[];var m=[];for(k=0;k<l.length;k++){if(l[k]!=null&&l[k][0]!=null&&l[k][1]!=null){r.push(l[k][0]);q.push(l[k][1])}}if(p=="linear"){n=h(r,q);for(var k=0;k<r.length;k++){o=n[0]*r[k]+n[1];m.push([r[k],o])}}else{if(p=="exp"||p=="exponential"){n=d(r,q);for(var k=0;k<r.length;k++){o=n[1]*Math.pow(n[0],r[k]);m.push([r[k],o])}}}return{data:m,slope:n[0],intercept:n[1]}}})(jQuery);




/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.0b2_r1012
 *
 * Copyright (c) 2009-2011 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 * included jsDate library by Chris Leonello:
 *
 * Copyright (c) 2010-2011 Chris Leonello
 *
 * jsDate is currently available for use in all personal or commercial projects 
 * under both the MIT and GPL version 2.0 licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly.
 *
 * jsDate borrows many concepts and ideas from the Date Instance 
 * Methods by Ken Snyder along with some parts of Ken's actual code.
 * 
 * Ken's origianl Date Instance Methods and copyright notice:
 * 
 * Ken Snyder (ken d snyder at gmail dot com)
 * 2008-09-10
 * version 2.0.2 (http://kendsnyder.com/sandbox/date/)     
 * Creative Commons Attribution License 3.0 (http://creativecommons.org/licenses/by/3.0/)
 *
 * jqplotToImage function based on Larry Siden's export-jqplot-to-png.js.
 * Larry has generously given permission to adapt his code for inclusion
 * into jqPlot.
 *
 * Larry's original code can be found here:
 *
 * https://github.com/lsiden/export-jqplot-to-png
 * 
 * 
 */
(function(h){h.jqplot.DateAxisRenderer=function(){h.jqplot.LinearAxisRenderer.call(this);this.date=new h.jsDate()};var c=1000;var e=60*c;var f=60*e;var l=24*f;var b=7*l;var j=30.4368499*l;var k=365.242199*l;var g=[31,28,31,30,31,30,31,30,31,30,31,30];var i=["%M:%S.%#N","%M:%S.%#N","%M:%S.%#N","%M:%S","%M:%S","%M:%S","%M:%S","%H:%M:%S","%H:%M:%S","%H:%M","%H:%M","%H:%M","%H:%M","%H:%M","%H:%M","%a %H:%M","%a %H:%M","%b %e %H:%M","%b %e %H:%M","%b %e %H:%M","%b %e %H:%M","%v","%v","%v","%v","%v","%v","%v"];var m=[0.1*c,0.2*c,0.5*c,c,2*c,5*c,10*c,15*c,30*c,e,2*e,5*e,10*e,15*e,30*e,f,2*f,4*f,6*f,8*f,12*f,l,2*l,3*l,4*l,5*l,b,2*b];var d=[];function a(p,s,t){var o=Number.MAX_VALUE;var u,r,v;for(var q=0,n=m.length;q<n;q++){u=Math.abs(t-m[q]);if(u<o){o=u;r=m[q];v=i[q]}}return[r,v]}h.jqplot.DateAxisRenderer.prototype=new h.jqplot.LinearAxisRenderer();h.jqplot.DateAxisRenderer.prototype.constructor=h.jqplot.DateAxisRenderer;h.jqplot.DateTickFormatter=function(n,o){if(!n){n="%Y/%m/%d"}return h.jsDate.strftime(o,n)};h.jqplot.DateAxisRenderer.prototype.init=function(E){this.tickOptions.formatter=h.jqplot.DateTickFormatter;this.tickInset=0;this.drawBaseline=true;this.baselineWidth=null;this.baselineColor=null;this.daTickInterval=null;this._daTickInterval=null;h.extend(true,this,E);var C=this._dataBounds,u,x,D,y,A,z,o;for(var t=0;t<this._series.length;t++){u={intervals:[],frequencies:{},sortedIntervals:[],min:null,max:null,mean:null};x=0;D=this._series[t];y=D.data;A=D._plotData;z=D._stackData;o=0;for(var r=0;r<y.length;r++){if(this.name=="xaxis"||this.name=="x2axis"){y[r][0]=new h.jsDate(y[r][0]).getTime();A[r][0]=new h.jsDate(y[r][0]).getTime();z[r][0]=new h.jsDate(y[r][0]).getTime();if((y[r][0]!=null&&y[r][0]<C.min)||C.min==null){C.min=y[r][0]}if((y[r][0]!=null&&y[r][0]>C.max)||C.max==null){C.max=y[r][0]}if(r>0){o=Math.abs(y[r][0]-y[r-1][0]);u.intervals.push(o);if(u.frequencies.hasOwnProperty(o)){u.frequencies[o]+=1}else{u.frequencies[o]=1}}x+=o}else{y[r][1]=new h.jsDate(y[r][1]).getTime();A[r][1]=new h.jsDate(y[r][1]).getTime();z[r][1]=new h.jsDate(y[r][1]).getTime();if((y[r][1]!=null&&y[r][1]<C.min)||C.min==null){C.min=y[r][1]}if((y[r][1]!=null&&y[r][1]>C.max)||C.max==null){C.max=y[r][1]}if(r>0){o=Math.abs(y[r][1]-y[r-1][1]);u.intervals.push(o);if(u.frequencies.hasOwnProperty(o)){u.frequencies[o]+=1}else{u.frequencies[o]=1}}}x+=o}if(D.renderer.bands){if(D.renderer.bands.hiData.length){var w=D.renderer.bands.hiData;for(var r=0,q=w.length;r<q;r++){if(this.name==="xaxis"||this.name==="x2axis"){w[r][0]=new h.jsDate(w[r][0]).getTime();if((w[r][0]!=null&&w[r][0]>C.max)||C.max==null){C.max=w[r][0]}}else{w[r][1]=new h.jsDate(w[r][1]).getTime();if((w[r][1]!=null&&w[r][1]>C.max)||C.max==null){C.max=w[r][1]}}}}if(D.renderer.bands.lowData.length){var w=D.renderer.bands.lowData;for(var r=0,q=w.length;r<q;r++){if(this.name==="xaxis"||this.name==="x2axis"){w[r][0]=new h.jsDate(w[r][0]).getTime();if((w[r][0]!=null&&w[r][0]<C.min)||C.min==null){C.min=w[r][0]}}else{w[r][1]=new h.jsDate(w[r][1]).getTime();if((w[r][1]!=null&&w[r][1]<C.min)||C.min==null){C.min=w[r][1]}}}}}var B=0,v=0;for(var p in u.frequencies){u.sortedIntervals.push({interval:p,frequency:u.frequencies[p]})}u.sortedIntervals.sort(function(s,n){return n.frequency-s.frequency});u.min=h.jqplot.arrayMin(u.intervals);u.max=h.jqplot.arrayMax(u.intervals);u.mean=x/y.length;this._intervalStats.push(u);u=x=D=y=A=z=null}C=null};h.jqplot.DateAxisRenderer.prototype.reset=function(){this.min=this._options.min;this.max=this._options.max;this.tickInterval=this._options.tickInterval;this.numberTicks=this._options.numberTicks;this._autoFormatString="";if(this._overrideFormatString&&this.tickOptions&&this.tickOptions.formatString){this.tickOptions.formatString=""}this.daTickInterval=this._daTickInterval};h.jqplot.DateAxisRenderer.prototype.createTicks=function(p){var U=this._ticks;var J=this.ticks;var E=this.name;var G=this._dataBounds;var L=this._intervalStats;var n=(this.name.charAt(0)==="x")?this._plotDimensions.width:this._plotDimensions.height;var w;var ab,I;var y,x;var aa,X;var s=30;var N=1;var v=this.tickInterval;ab=((this.min!=null)?new h.jsDate(this.min).getTime():G.min);I=((this.max!=null)?new h.jsDate(this.max).getTime():G.max);var A=p.plugins.cursor;if(A&&A._zoom&&A._zoom.zooming){this.min=null;this.max=null}var B=I-ab;if(this.tickOptions==null||!this.tickOptions.formatString){this._overrideFormatString=true}if(J.length){for(X=0;X<J.length;X++){var O=J[X];var V=new this.tickRenderer(this.tickOptions);if(O.constructor==Array){V.value=new h.jsDate(O[0]).getTime();V.label=O[1];if(!this.showTicks){V.showLabel=false;V.showMark=false}else{if(!this.showTickMarks){V.showMark=false}}V.setTick(V.value,this.name);this._ticks.push(V)}else{V.value=new h.jsDate(O).getTime();if(!this.showTicks){V.showLabel=false;V.showMark=false}else{if(!this.showTickMarks){V.showMark=false}}V.setTick(V.value,this.name);this._ticks.push(V)}}this.numberTicks=J.length;this.min=this._ticks[0].value;this.max=this._ticks[this.numberTicks-1].value;this.daTickInterval=[(this.max-this.min)/(this.numberTicks-1)/1000,"seconds"]}else{if(this.min==null&&this.max==null){var M=h.extend(true,{},this.tickOptions,{name:this.name,value:null});var Y,H;if(!this.tickInterval&&!this.numberTicks){var Q=Math.max(n,s+1);var W=115;if(this.tickRenderer===h.jqplot.CanvasAxisTickRenderer&&this.tickOptions.angle){W=115-40*Math.abs(Math.sin(this.tickOptions.angle/180*Math.PI))}Y=Math.ceil((Q-s)/W+1);H=(I-ab)/(Y-1)}else{if(this.tickInterval){H=this.tickInterval}else{if(this.numberTicks){Y=this.numberTicks;H=(I-ab)/(Y-1)}}}if(H<=19*l){var P=a(ab,I,H);var r=P[0];this._autoFormatString=P[1];ab=Math.floor(ab/r)*r;ab=new h.jsDate(ab);ab=ab.getTime()+ab.getUtcOffset();Y=Math.ceil((I-ab)/r)+1;this.min=ab;this.max=ab+(Y-1)*r;if(this.max<I){this.max+=r;Y+=1}this.tickInterval=r;this.numberTicks=Y;for(var X=0;X<Y;X++){M.value=this.min+X*r;V=new this.tickRenderer(M);if(this._overrideFormatString&&this._autoFormatString!=""){V.formatString=this._autoFormatString}if(!this.showTicks){V.showLabel=false;V.showMark=false}else{if(!this.showTickMarks){V.showMark=false}}this._ticks.push(V)}N=this.tickInterval}else{if(H<=9*j){this._autoFormatString="%v";var D=Math.round(H/j);if(D<1){D=1}else{if(D>6){D=6}}var S=new h.jsDate(ab).setDate(1).setHours(0,0,0,0);var q=new h.jsDate(I);var z=new h.jsDate(I).setDate(1).setHours(0,0,0,0);if(q.getTime()!==z.getTime()){z=z.add(1,"month")}var R=z.diff(S,"month");Y=Math.ceil(R/D)+1;this.min=S.getTime();this.max=S.clone().add((Y-1)*D,"month").getTime();this.numberTicks=Y;for(var X=0;X<Y;X++){if(X===0){M.value=S.getTime()}else{M.value=S.add(D,"month").getTime()}V=new this.tickRenderer(M);if(this._overrideFormatString&&this._autoFormatString!=""){V.formatString=this._autoFormatString}if(!this.showTicks){V.showLabel=false;V.showMark=false}else{if(!this.showTickMarks){V.showMark=false}}this._ticks.push(V)}N=D*j}else{this._autoFormatString="%v";var D=Math.round(H/k);if(D<1){D=1}var S=new h.jsDate(ab).setMonth(0,1).setHours(0,0,0,0);var z=new h.jsDate(I).add(1,"year").setMonth(0,1).setHours(0,0,0,0);var K=z.diff(S,"year");Y=Math.ceil(K/D)+1;this.min=S.getTime();this.max=S.clone().add((Y-1)*D,"year").getTime();this.numberTicks=Y;for(var X=0;X<Y;X++){if(X===0){M.value=S.getTime()}else{M.value=S.add(D,"year").getTime()}V=new this.tickRenderer(M);if(this._overrideFormatString&&this._autoFormatString!=""){V.formatString=this._autoFormatString}if(!this.showTicks){V.showLabel=false;V.showMark=false}else{if(!this.showTickMarks){V.showMark=false}}this._ticks.push(V)}N=D*k}}}else{if(E=="xaxis"||E=="x2axis"){n=this._plotDimensions.width}else{n=this._plotDimensions.height}if(this.min!=null&&this.max!=null&&this.numberTicks!=null){this.tickInterval=null}if(this.tickInterval!=null){if(Number(this.tickInterval)){this.daTickInterval=[Number(this.tickInterval),"seconds"]}else{if(typeof this.tickInterval=="string"){var Z=this.tickInterval.split(" ");if(Z.length==1){this.daTickInterval=[1,Z[0]]}else{if(Z.length==2){this.daTickInterval=[Z[0],Z[1]]}}}}}if(ab==I){var o=24*60*60*500;ab-=o;I+=o}B=I-ab;var F=2+parseInt(Math.max(0,n-100)/100,10);var T,C;T=(this.min!=null)?new h.jsDate(this.min).getTime():ab-B/2*(this.padMin-1);C=(this.max!=null)?new h.jsDate(this.max).getTime():I+B/2*(this.padMax-1);this.min=T;this.max=C;B=this.max-this.min;if(this.numberTicks==null){if(this.daTickInterval!=null){var u=new h.jsDate(this.max).diff(this.min,this.daTickInterval[1],true);this.numberTicks=Math.ceil(u/this.daTickInterval[0])+1;this.max=new h.jsDate(this.min).add((this.numberTicks-1)*this.daTickInterval[0],this.daTickInterval[1]).getTime()}else{if(n>200){this.numberTicks=parseInt(3+(n-200)/100,10)}else{this.numberTicks=2}}}N=B/(this.numberTicks-1)/1000;if(this.daTickInterval==null){this.daTickInterval=[N,"seconds"]}for(var X=0;X<this.numberTicks;X++){var ab=new h.jsDate(this.min);aa=ab.add(X*this.daTickInterval[0],this.daTickInterval[1]).getTime();var V=new this.tickRenderer(this.tickOptions);if(!this.showTicks){V.showLabel=false;V.showMark=false}else{if(!this.showTickMarks){V.showMark=false}}V.setTick(aa,this.name);this._ticks.push(V)}}}if(this.tickInset){this.min=this.min-this.tickInset*N;this.max=this.max+this.tickInset*N}if(this._daTickInterval==null){this._daTickInterval=this.daTickInterval}U=null}})(jQuery);




/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.0b2_r1012
 *
 * Copyright (c) 2009-2011 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 * included jsDate library by Chris Leonello:
 *
 * Copyright (c) 2010-2011 Chris Leonello
 *
 * jsDate is currently available for use in all personal or commercial projects 
 * under both the MIT and GPL version 2.0 licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly.
 *
 * jsDate borrows many concepts and ideas from the Date Instance 
 * Methods by Ken Snyder along with some parts of Ken's actual code.
 * 
 * Ken's origianl Date Instance Methods and copyright notice:
 * 
 * Ken Snyder (ken d snyder at gmail dot com)
 * 2008-09-10
 * version 2.0.2 (http://kendsnyder.com/sandbox/date/)     
 * Creative Commons Attribution License 3.0 (http://creativecommons.org/licenses/by/3.0/)
 *
 * jqplotToImage function based on Larry Siden's export-jqplot-to-png.js.
 * Larry has generously given permission to adapt his code for inclusion
 * into jqPlot.
 *
 * Larry's original code can be found here:
 *
 * https://github.com/lsiden/export-jqplot-to-png
 * 
 * 
 */
(function(j){j.jqplot.Cursor=function(q){this.style="crosshair";this.previousCursor="auto";this.show=j.jqplot.config.enablePlugins;this.showTooltip=true;this.followMouse=false;this.tooltipLocation="se";this.tooltipOffset=6;this.showTooltipGridPosition=false;this.showTooltipUnitPosition=true;this.showTooltipDataPosition=false;this.tooltipFormatString="%.4P, %.4P";this.useAxesFormatters=true;this.tooltipAxisGroups=[];this.zoom=false;this.zoomProxy=false;this.zoomTarget=false;this.looseZoom=true;this.clickReset=false;this.dblClickReset=true;this.showVerticalLine=false;this.showHorizontalLine=false;this.constrainZoomTo="none";this.shapeRenderer=new j.jqplot.ShapeRenderer();this._zoom={start:[],end:[],started:false,zooming:false,isZoomed:false,axes:{start:{},end:{}},gridpos:{},datapos:{}};this._tooltipElem;this.zoomCanvas;this.cursorCanvas;this.intersectionThreshold=2;this.showCursorLegend=false;this.cursorLegendFormatString=j.jqplot.Cursor.cursorLegendFormatString;this._oldHandlers={onselectstart:null,ondrag:null,onmousedown:null};this.constrainOutsideZoom=true;this.showTooltipOutsideZoom=false;this.onGrid=false;j.extend(true,this,q)};j.jqplot.Cursor.cursorLegendFormatString="%s x:%s, y:%s";j.jqplot.Cursor.init=function(t,s,r){var q=r||{};this.plugins.cursor=new j.jqplot.Cursor(q.cursor);var u=this.plugins.cursor;if(u.show){j.jqplot.eventListenerHooks.push(["jqplotMouseEnter",b]);j.jqplot.eventListenerHooks.push(["jqplotMouseLeave",f]);j.jqplot.eventListenerHooks.push(["jqplotMouseMove",i]);if(u.showCursorLegend){r.legend=r.legend||{};r.legend.renderer=j.jqplot.CursorLegendRenderer;r.legend.formatString=this.plugins.cursor.cursorLegendFormatString;r.legend.show=true}if(u.zoom){j.jqplot.eventListenerHooks.push(["jqplotMouseDown",a]);if(u.clickReset){j.jqplot.eventListenerHooks.push(["jqplotClick",k])}if(u.dblClickReset){j.jqplot.eventListenerHooks.push(["jqplotDblClick",c])}}this.resetZoom=function(){var x=this.axes;if(!u.zoomProxy){for(var w in x){x[w].reset();x[w]._ticks=[];if(u._zoom.axes[w]!==undefined){x[w]._autoFormatString=u._zoom.axes[w].tickFormatString}}this.redraw()}else{var v=this.plugins.cursor.zoomCanvas._ctx;v.clearRect(0,0,v.canvas.width,v.canvas.height);v=null}this.plugins.cursor._zoom.isZoomed=false;this.target.trigger("jqplotResetZoom",[this,this.plugins.cursor])};if(u.showTooltipDataPosition){u.showTooltipUnitPosition=false;u.showTooltipGridPosition=false;if(q.cursor.tooltipFormatString==undefined){u.tooltipFormatString=j.jqplot.Cursor.cursorLegendFormatString}}}};j.jqplot.Cursor.postDraw=function(){var x=this.plugins.cursor;if(x.zoomCanvas){x.zoomCanvas.resetCanvas();x.zoomCanvas=null}if(x.cursorCanvas){x.cursorCanvas.resetCanvas();x.cursorCanvas=null}if(x._tooltipElem){x._tooltipElem.emptyForce();x._tooltipElem=null}if(x.zoom){x.zoomCanvas=new j.jqplot.GenericCanvas();this.eventCanvas._elem.before(x.zoomCanvas.createElement(this._gridPadding,"jqplot-zoom-canvas",this._plotDimensions,this));x.zoomCanvas.setContext()}var v=document.createElement("div");x._tooltipElem=j(v);v=null;x._tooltipElem.addClass("jqplot-cursor-tooltip");x._tooltipElem.css({position:"absolute",display:"none"});if(x.zoomCanvas){x.zoomCanvas._elem.before(x._tooltipElem)}else{this.eventCanvas._elem.before(x._tooltipElem)}if(x.showVerticalLine||x.showHorizontalLine){x.cursorCanvas=new j.jqplot.GenericCanvas();this.eventCanvas._elem.before(x.cursorCanvas.createElement(this._gridPadding,"jqplot-cursor-canvas",this._plotDimensions,this));x.cursorCanvas.setContext()}if(x.showTooltipUnitPosition){if(x.tooltipAxisGroups.length===0){var t=this.series;var u;var q=[];for(var r=0;r<t.length;r++){u=t[r];var w=u.xaxis+","+u.yaxis;if(j.inArray(w,q)==-1){q.push(w)}}for(var r=0;r<q.length;r++){x.tooltipAxisGroups.push(q[r].split(","))}}}};j.jqplot.Cursor.zoomProxy=function(v,r){var q=v.plugins.cursor;var u=r.plugins.cursor;q.zoomTarget=true;q.zoom=true;q.style="auto";q.dblClickReset=false;u.zoom=true;u.zoomProxy=true;r.target.bind("jqplotZoom",t);r.target.bind("jqplotResetZoom",s);function t(x,w,z,y,A){q.doZoom(w,z,v,A)}function s(w,x,y){v.resetZoom()}};j.jqplot.Cursor.prototype.resetZoom=function(u,v){var t=u.axes;var s=v._zoom.axes;if(!u.plugins.cursor.zoomProxy&&v._zoom.isZoomed){for(var r in t){t[r].reset();t[r]._ticks=[];t[r]._autoFormatString=s[r].tickFormatString}u.redraw();v._zoom.isZoomed=false}else{var q=v.zoomCanvas._ctx;q.clearRect(0,0,q.canvas.width,q.canvas.height);q=null}u.target.trigger("jqplotResetZoom",[u,v])};j.jqplot.Cursor.resetZoom=function(q){q.resetZoom()};j.jqplot.Cursor.prototype.doZoom=function(G,t,C,u){var I=u;var F=C.axes;var r=I._zoom.axes;var w=r.start;var s=r.end;var B,E,z,D,v,x,q,H,J;var A=C.plugins.cursor.zoomCanvas._ctx;if((I.constrainZoomTo=="none"&&Math.abs(G.x-I._zoom.start[0])>6&&Math.abs(G.y-I._zoom.start[1])>6)||(I.constrainZoomTo=="x"&&Math.abs(G.x-I._zoom.start[0])>6)||(I.constrainZoomTo=="y"&&Math.abs(G.y-I._zoom.start[1])>6)){if(!C.plugins.cursor.zoomProxy){for(var y in t){if(I._zoom.axes[y]==undefined){I._zoom.axes[y]={};I._zoom.axes[y].numberTicks=F[y].numberTicks;I._zoom.axes[y].tickInterval=F[y].tickInterval;I._zoom.axes[y].daTickInterval=F[y].daTickInterval;I._zoom.axes[y].min=F[y].min;I._zoom.axes[y].max=F[y].max;I._zoom.axes[y].tickFormatString=(F[y].tickOptions!=null)?F[y].tickOptions.formatString:""}if((I.constrainZoomTo=="none")||(I.constrainZoomTo=="x"&&y.charAt(0)=="x")||(I.constrainZoomTo=="y"&&y.charAt(0)=="y")){z=t[y];if(z!=null){if(z>w[y]){v=w[y];x=z}else{D=w[y]-z;v=z;x=w[y]}q=F[y];H=null;if(q.alignTicks){if(q.name==="x2axis"&&C.axes.xaxis.show){H=C.axes.xaxis.numberTicks}else{if(q.name.charAt(0)==="y"&&q.name!=="yaxis"&&q.name!=="yMidAxis"&&C.axes.yaxis.show){H=C.axes.yaxis.numberTicks}}}if(this.looseZoom&&(F[y].renderer.constructor===j.jqplot.LinearAxisRenderer||F[y].renderer.constructor===j.jqplot.LogAxisRenderer)){J=j.jqplot.LinearTickGenerator(v,x,q._scalefact,H);if(F[y].tickInset&&J[0]<F[y].min+F[y].tickInset*F[y].tickInterval){J[0]+=J[4];J[2]-=1}if(F[y].tickInset&&J[1]>F[y].max-F[y].tickInset*F[y].tickInterval){J[1]-=J[4];J[2]-=1}if(F[y].renderer.constructor===j.jqplot.LogAxisRenderer&&J[0]<F[y].min){J[0]+=J[4];J[2]-=1}F[y].min=J[0];F[y].max=J[1];F[y]._autoFormatString=J[3];F[y].numberTicks=J[2];F[y].tickInterval=J[4];F[y].daTickInterval=[J[4]/1000,"seconds"]}else{F[y].min=v;F[y].max=x;F[y].tickInterval=null;F[y].numberTicks=null;F[y].daTickInterval=null}F[y]._ticks=[]}}}A.clearRect(0,0,A.canvas.width,A.canvas.height);C.redraw();I._zoom.isZoomed=true;A=null}C.target.trigger("jqplotZoom",[G,t,C,u])}};j.jqplot.preInitHooks.push(j.jqplot.Cursor.init);j.jqplot.postDrawHooks.push(j.jqplot.Cursor.postDraw);function e(E,r,B){var G=B.plugins.cursor;var w="";var K=false;if(G.showTooltipGridPosition){w=E.x+", "+E.y;K=true}if(G.showTooltipUnitPosition){var D;for(var C=0;C<G.tooltipAxisGroups.length;C++){D=G.tooltipAxisGroups[C];if(K){w+="<br />"}if(G.useAxesFormatters){var A=B.axes[D[0]]._ticks[0].formatter;var q=B.axes[D[1]]._ticks[0].formatter;var H=B.axes[D[0]]._ticks[0].formatString;var v=B.axes[D[1]]._ticks[0].formatString;w+=A(H,r[D[0]])+", "+q(v,r[D[1]])}else{w+=j.jqplot.sprintf(G.tooltipFormatString,r[D[0]],r[D[1]])}K=true}}if(G.showTooltipDataPosition){var u=B.series;var J=d(B,E.x,E.y);var K=false;for(var C=0;C<u.length;C++){if(u[C].show){var y=u[C].index;var t=u[C].label.toString();var F=j.inArray(y,J.indices);var z=undefined;var x=undefined;if(F!=-1){var I=J.data[F].data;if(G.useAxesFormatters){var A=u[C]._xaxis._ticks[0].formatter;var q=u[C]._yaxis._ticks[0].formatter;var H=u[C]._xaxis._ticks[0].formatString;var v=u[C]._yaxis._ticks[0].formatString;z=A(H,I[0]);x=q(v,I[1])}else{z=I[0];x=I[1]}if(K){w+="<br />"}w+=j.jqplot.sprintf(G.tooltipFormatString,t,z,x);K=true}}}}G._tooltipElem.html(w)}function g(C,A){var E=A.plugins.cursor;var z=E.cursorCanvas._ctx;z.clearRect(0,0,z.canvas.width,z.canvas.height);if(E.showVerticalLine){E.shapeRenderer.draw(z,[[C.x,0],[C.x,z.canvas.height]])}if(E.showHorizontalLine){E.shapeRenderer.draw(z,[[0,C.y],[z.canvas.width,C.y]])}var G=d(A,C.x,C.y);if(E.showCursorLegend){var r=j(A.targetId+" td.jqplot-cursor-legend-label");for(var B=0;B<r.length;B++){var v=j(r[B]).data("seriesIndex");var t=A.series[v];var s=t.label.toString();var D=j.inArray(v,G.indices);var x=undefined;var w=undefined;if(D!=-1){var H=G.data[D].data;if(E.useAxesFormatters){var y=t._xaxis._ticks[0].formatter;var q=t._yaxis._ticks[0].formatter;var F=t._xaxis._ticks[0].formatString;var u=t._yaxis._ticks[0].formatString;x=y(F,H[0]);w=q(u,H[1])}else{x=H[0];w=H[1]}}if(A.legend.escapeHtml){j(r[B]).text(j.jqplot.sprintf(E.cursorLegendFormatString,s,x,w))}else{j(r[B]).html(j.jqplot.sprintf(E.cursorLegendFormatString,s,x,w))}}}z=null}function d(A,F,E){var B={indices:[],data:[]};var G,w,u,C,v,q,t;var z;var D=A.plugins.cursor;for(var w=0;w<A.series.length;w++){G=A.series[w];q=G.renderer;if(G.show){z=D.intersectionThreshold;if(G.showMarker){z+=G.markerRenderer.size/2}for(var v=0;v<G.gridData.length;v++){t=G.gridData[v];if(D.showVerticalLine){if(Math.abs(F-t[0])<=z){B.indices.push(w);B.data.push({seriesIndex:w,pointIndex:v,gridData:t,data:G.data[v]})}}}}}return B}function n(r,t){var v=t.plugins.cursor;var s=v._tooltipElem;switch(v.tooltipLocation){case"nw":var q=r.x+t._gridPadding.left-s.outerWidth(true)-v.tooltipOffset;var u=r.y+t._gridPadding.top-v.tooltipOffset-s.outerHeight(true);break;case"n":var q=r.x+t._gridPadding.left-s.outerWidth(true)/2;var u=r.y+t._gridPadding.top-v.tooltipOffset-s.outerHeight(true);break;case"ne":var q=r.x+t._gridPadding.left+v.tooltipOffset;var u=r.y+t._gridPadding.top-v.tooltipOffset-s.outerHeight(true);break;case"e":var q=r.x+t._gridPadding.left+v.tooltipOffset;var u=r.y+t._gridPadding.top-s.outerHeight(true)/2;break;case"se":var q=r.x+t._gridPadding.left+v.tooltipOffset;var u=r.y+t._gridPadding.top+v.tooltipOffset;break;case"s":var q=r.x+t._gridPadding.left-s.outerWidth(true)/2;var u=r.y+t._gridPadding.top+v.tooltipOffset;break;case"sw":var q=r.x+t._gridPadding.left-s.outerWidth(true)-v.tooltipOffset;var u=r.y+t._gridPadding.top+v.tooltipOffset;break;case"w":var q=r.x+t._gridPadding.left-s.outerWidth(true)-v.tooltipOffset;var u=r.y+t._gridPadding.top-s.outerHeight(true)/2;break;default:var q=r.x+t._gridPadding.left+v.tooltipOffset;var u=r.y+t._gridPadding.top+v.tooltipOffset;break}s.css("left",q);s.css("top",u);s=null}function m(u){var s=u._gridPadding;var v=u.plugins.cursor;var t=v._tooltipElem;switch(v.tooltipLocation){case"nw":var r=s.left+v.tooltipOffset;var q=s.top+v.tooltipOffset;t.css("left",r);t.css("top",q);break;case"n":var r=(s.left+(u._plotDimensions.width-s.right))/2-t.outerWidth(true)/2;var q=s.top+v.tooltipOffset;t.css("left",r);t.css("top",q);break;case"ne":var r=s.right+v.tooltipOffset;var q=s.top+v.tooltipOffset;t.css({right:r,top:q});break;case"e":var r=s.right+v.tooltipOffset;var q=(s.top+(u._plotDimensions.height-s.bottom))/2-t.outerHeight(true)/2;t.css({right:r,top:q});break;case"se":var r=s.right+v.tooltipOffset;var q=s.bottom+v.tooltipOffset;t.css({right:r,bottom:q});break;case"s":var r=(s.left+(u._plotDimensions.width-s.right))/2-t.outerWidth(true)/2;var q=s.bottom+v.tooltipOffset;t.css({left:r,bottom:q});break;case"sw":var r=s.left+v.tooltipOffset;var q=s.bottom+v.tooltipOffset;t.css({left:r,bottom:q});break;case"w":var r=s.left+v.tooltipOffset;var q=(s.top+(u._plotDimensions.height-s.bottom))/2-t.outerHeight(true)/2;t.css({left:r,top:q});break;default:var r=s.right-v.tooltipOffset;var q=s.bottom+v.tooltipOffset;t.css({right:r,bottom:q});break}t=null}function k(r,q,v,u,t){r.preventDefault();r.stopImmediatePropagation();var w=t.plugins.cursor;if(w.clickReset){w.resetZoom(t,w)}var s=window.getSelection;if(document.selection&&document.selection.empty){document.selection.empty()}else{if(s&&!s().isCollapsed){s().collapse()}}return false}function c(r,q,v,u,t){r.preventDefault();r.stopImmediatePropagation();var w=t.plugins.cursor;if(w.dblClickReset){w.resetZoom(t,w)}var s=window.getSelection;if(document.selection&&document.selection.empty){document.selection.empty()}else{if(s&&!s().isCollapsed){s().collapse()}}return false}function f(w,t,q,z,u){var v=u.plugins.cursor;v.onGrid=false;if(v.show){j(w.target).css("cursor",v.previousCursor);if(v.showTooltip&&!(v._zoom.zooming&&v.showTooltipOutsideZoom&&!v.constrainOutsideZoom)){v._tooltipElem.hide()}if(v.zoom){v._zoom.gridpos=t;v._zoom.datapos=q}if(v.showVerticalLine||v.showHorizontalLine){var B=v.cursorCanvas._ctx;B.clearRect(0,0,B.canvas.width,B.canvas.height);B=null}if(v.showCursorLegend){var A=j(u.targetId+" td.jqplot-cursor-legend-label");for(var s=0;s<A.length;s++){var y=j(A[s]).data("seriesIndex");var r=u.series[y];var x=r.label.toString();if(u.legend.escapeHtml){j(A[s]).text(j.jqplot.sprintf(v.cursorLegendFormatString,x,undefined,undefined))}else{j(A[s]).html(j.jqplot.sprintf(v.cursorLegendFormatString,x,undefined,undefined))}}}}}function b(r,q,u,t,s){var v=s.plugins.cursor;v.onGrid=true;if(v.show){v.previousCursor=r.target.style.cursor;r.target.style.cursor=v.style;if(v.showTooltip){e(q,u,s);if(v.followMouse){n(q,s)}else{m(s)}v._tooltipElem.show()}if(v.showVerticalLine||v.showHorizontalLine){g(q,s)}}}function i(r,q,u,t,s){var v=s.plugins.cursor;if(v.show){if(v.showTooltip){e(q,u,s);if(v.followMouse){n(q,s)}}if(v.showVerticalLine||v.showHorizontalLine){g(q,s)}}}function o(y){var x=y.data.plot;var t=x.eventCanvas._elem.offset();var w={x:y.pageX-t.left,y:y.pageY-t.top};var u={xaxis:null,yaxis:null,x2axis:null,y2axis:null,y3axis:null,y4axis:null,y5axis:null,y6axis:null,y7axis:null,y8axis:null,y9axis:null,yMidAxis:null};var v=["xaxis","yaxis","x2axis","y2axis","y3axis","y4axis","y5axis","y6axis","y7axis","y8axis","y9axis","yMidAxis"];var q=x.axes;var r,s;for(r=11;r>0;r--){s=v[r-1];if(q[s].show){u[s]=q[s].series_p2u(w[s.charAt(0)])}}return{offsets:t,gridPos:w,dataPos:u}}function h(z){var x=z.data.plot;var y=x.plugins.cursor;if(y.show&&y.zoom&&y._zoom.started&&!y.zoomTarget){var B=y.zoomCanvas._ctx;var v=o(z);var w=v.gridPos;var t=v.dataPos;y._zoom.gridpos=w;y._zoom.datapos=t;y._zoom.zooming=true;var u=w.x;var s=w.y;var A=B.canvas.height;var q=B.canvas.width;if(y.showTooltip&&!y.onGrid&&y.showTooltipOutsideZoom){e(w,t,x);if(y.followMouse){n(w,x)}}if(y.constrainZoomTo=="x"){y._zoom.end=[u,A]}else{if(y.constrainZoomTo=="y"){y._zoom.end=[q,s]}else{y._zoom.end=[u,s]}}var r=window.getSelection;if(document.selection&&document.selection.empty){document.selection.empty()}else{if(r&&!r().isCollapsed){r().collapse()}}l.call(y);B=null}}function a(w,s,r,x,t){var v=t.plugins.cursor;j(document).one("mouseup.jqplot_cursor",{plot:t},p);var u=t.axes;if(document.onselectstart!=undefined){v._oldHandlers.onselectstart=document.onselectstart;document.onselectstart=function(){return false}}if(document.ondrag!=undefined){v._oldHandlers.ondrag=document.ondrag;document.ondrag=function(){return false}}if(document.onmousedown!=undefined){v._oldHandlers.onmousedown=document.onmousedown;document.onmousedown=function(){return false}}if(v.zoom){if(!v.zoomProxy){var y=v.zoomCanvas._ctx;y.clearRect(0,0,y.canvas.width,y.canvas.height);y=null}if(v.constrainZoomTo=="x"){v._zoom.start=[s.x,0]}else{if(v.constrainZoomTo=="y"){v._zoom.start=[0,s.y]}else{v._zoom.start=[s.x,s.y]}}v._zoom.started=true;for(var q in r){v._zoom.axes.start[q]=r[q]}j(document).bind("mousemove.jqplotCursor",{plot:t},h)}}function p(y){var v=y.data.plot;var x=v.plugins.cursor;if(x.zoom&&x._zoom.zooming&&!x.zoomTarget){var u=x._zoom.gridpos.x;var r=x._zoom.gridpos.y;var t=x._zoom.datapos;var z=x.zoomCanvas._ctx.canvas.height;var q=x.zoomCanvas._ctx.canvas.width;var w=v.axes;if(x.constrainOutsideZoom&&!x.onGrid){if(u<0){u=0}else{if(u>q){u=q}}if(r<0){r=0}else{if(r>z){r=z}}for(var s in t){if(t[s]){if(s.charAt(0)=="x"){t[s]=w[s].series_p2u(u)}else{t[s]=w[s].series_p2u(r)}}}}if(x.constrainZoomTo=="x"){r=z}else{if(x.constrainZoomTo=="y"){u=q}}x._zoom.end=[u,r];x._zoom.gridpos={x:u,y:r};x.doZoom(x._zoom.gridpos,t,v,x)}x._zoom.started=false;x._zoom.zooming=false;j(document).unbind("mousemove.jqplotCursor",h);if(document.onselectstart!=undefined&&x._oldHandlers.onselectstart!=null){document.onselectstart=x._oldHandlers.onselectstart;x._oldHandlers.onselectstart=null}if(document.ondrag!=undefined&&x._oldHandlers.ondrag!=null){document.ondrag=x._oldHandlers.ondrag;x._oldHandlers.ondrag=null}if(document.onmousedown!=undefined&&x._oldHandlers.onmousedown!=null){document.onmousedown=x._oldHandlers.onmousedown;x._oldHandlers.onmousedown=null}}function l(){var y=this._zoom.start;var u=this._zoom.end;var s=this.zoomCanvas._ctx;var r,v,x,q;if(u[0]>y[0]){r=y[0];q=u[0]-y[0]}else{r=u[0];q=y[0]-u[0]}if(u[1]>y[1]){v=y[1];x=u[1]-y[1]}else{v=u[1];x=y[1]-u[1]}s.fillStyle="rgba(0,0,0,0.2)";s.strokeStyle="#999999";s.lineWidth=1;s.clearRect(0,0,s.canvas.width,s.canvas.height);s.fillRect(0,0,s.canvas.width,s.canvas.height);s.clearRect(r,v,q,x);s.strokeRect(r,v,q,x);s=null}j.jqplot.CursorLegendRenderer=function(q){j.jqplot.TableLegendRenderer.call(this,q);this.formatString="%s"};j.jqplot.CursorLegendRenderer.prototype=new j.jqplot.TableLegendRenderer();j.jqplot.CursorLegendRenderer.prototype.constructor=j.jqplot.CursorLegendRenderer;j.jqplot.CursorLegendRenderer.prototype.draw=function(){if(this._elem){this._elem.emptyForce();this._elem=null}if(this.show){var w=this._series,A;var r=document.createElement("div");this._elem=j(r);r=null;this._elem.addClass("jqplot-legend jqplot-cursor-legend");this._elem.css("position","absolute");var q=false;for(var x=0;x<w.length;x++){A=w[x];if(A.show&&A.showLabel){var v=j.jqplot.sprintf(this.formatString,A.label.toString());if(v){var t=A.color;if(A._stack&&!A.fill){t=""}z.call(this,v,t,q,x);q=true}for(var u=0;u<j.jqplot.addLegendRowHooks.length;u++){var y=j.jqplot.addLegendRowHooks[u].call(this,A);if(y){z.call(this,y.label,y.color,q);q=true}}}}w=A=null;delete w;delete A}function z(D,C,F,s){var B=(F)?this.rowSpacing:"0";var E=j('<tr class="jqplot-legend jqplot-cursor-legend"></tr>').appendTo(this._elem);E.data("seriesIndex",s);j('<td class="jqplot-legend jqplot-cursor-legend-swatch" style="padding-top:'+B+';"><div style="border:1px solid #cccccc;padding:0.2em;"><div class="jqplot-cursor-legend-swatch" style="background-color:'+C+';"></div></div></td>').appendTo(E);var G=j('<td class="jqplot-legend jqplot-cursor-legend-label" style="vertical-align:middle;padding-top:'+B+';"></td>');G.appendTo(E);G.data("seriesIndex",s);if(this.escapeHtml){G.text(D)}else{G.html(D)}E=null;G=null}return this._elem}})(jQuery);




/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.0b2_r1012
 *
 * Copyright (c) 2009-2011 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 * included jsDate library by Chris Leonello:
 *
 * Copyright (c) 2010-2011 Chris Leonello
 *
 * jsDate is currently available for use in all personal or commercial projects 
 * under both the MIT and GPL version 2.0 licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly.
 *
 * jsDate borrows many concepts and ideas from the Date Instance 
 * Methods by Ken Snyder along with some parts of Ken's actual code.
 * 
 * Ken's origianl Date Instance Methods and copyright notice:
 * 
 * Ken Snyder (ken d snyder at gmail dot com)
 * 2008-09-10
 * version 2.0.2 (http://kendsnyder.com/sandbox/date/)     
 * Creative Commons Attribution License 3.0 (http://creativecommons.org/licenses/by/3.0/)
 *
 * jqplotToImage function based on Larry Siden's export-jqplot-to-png.js.
 * Larry has generously given permission to adapt his code for inclusion
 * into jqPlot.
 *
 * Larry's original code can be found here:
 *
 * https://github.com/lsiden/export-jqplot-to-png
 * 
 * 
 */
(function(a){a.jqplot.CategoryAxisRenderer=function(b){a.jqplot.LinearAxisRenderer.call(this);this.sortMergedLabels=false};a.jqplot.CategoryAxisRenderer.prototype=new a.jqplot.LinearAxisRenderer();a.jqplot.CategoryAxisRenderer.prototype.constructor=a.jqplot.CategoryAxisRenderer;a.jqplot.CategoryAxisRenderer.prototype.init=function(e){this.groups=1;this.groupLabels=[];this._groupLabels=[];this._grouped=false;this._barsPerGroup=null;a.extend(true,this,{tickOptions:{formatString:"%d"}},e);var b=this._dataBounds;for(var f=0;f<this._series.length;f++){var g=this._series[f];if(g.groups){this.groups=g.groups}var h=g.data;for(var c=0;c<h.length;c++){if(this.name=="xaxis"||this.name=="x2axis"){if(h[c][0]<b.min||b.min==null){b.min=h[c][0]}if(h[c][0]>b.max||b.max==null){b.max=h[c][0]}}else{if(h[c][1]<b.min||b.min==null){b.min=h[c][1]}if(h[c][1]>b.max||b.max==null){b.max=h[c][1]}}}}if(this.groupLabels.length){this.groups=this.groupLabels.length}};a.jqplot.CategoryAxisRenderer.prototype.createTicks=function(){var D=this._ticks;var z=this.ticks;var F=this.name;var C=this._dataBounds;var v,A;var q,w;var d,c;var b,x;if(z.length){if(this.groups>1&&!this._grouped){var r=z.length;var p=parseInt(r/this.groups,10);var e=0;for(var x=p;x<r;x+=p){z.splice(x+e,0," ");e++}this._grouped=true}this.min=0.5;this.max=z.length+0.5;var m=this.max-this.min;this.numberTicks=2*z.length+1;for(x=0;x<z.length;x++){b=this.min+2*x*m/(this.numberTicks-1);var h=new this.tickRenderer(this.tickOptions);h.showLabel=false;h.setTick(b,this.name);this._ticks.push(h);var h=new this.tickRenderer(this.tickOptions);h.label=z[x];h.showMark=false;h.showGridline=false;h.setTick(b+0.5,this.name);this._ticks.push(h)}var h=new this.tickRenderer(this.tickOptions);h.showLabel=false;h.setTick(b+1,this.name);this._ticks.push(h)}else{if(F=="xaxis"||F=="x2axis"){v=this._plotDimensions.width}else{v=this._plotDimensions.height}if(this.min!=null&&this.max!=null&&this.numberTicks!=null){this.tickInterval=null}if(this.min!=null&&this.max!=null&&this.tickInterval!=null){if(parseInt((this.max-this.min)/this.tickInterval,10)!=(this.max-this.min)/this.tickInterval){this.tickInterval=null}}var y=[];var B=0;var q=0.5;var w,E;var f=false;for(var x=0;x<this._series.length;x++){var k=this._series[x];for(var u=0;u<k.data.length;u++){if(this.name=="xaxis"||this.name=="x2axis"){E=k.data[u][0]}else{E=k.data[u][1]}if(a.inArray(E,y)==-1){f=true;B+=1;y.push(E)}}}if(f&&this.sortMergedLabels){y.sort(function(j,i){return j-i})}this.ticks=y;for(var x=0;x<this._series.length;x++){var k=this._series[x];for(var u=0;u<k.data.length;u++){if(this.name=="xaxis"||this.name=="x2axis"){E=k.data[u][0]}else{E=k.data[u][1]}var n=a.inArray(E,y)+1;if(this.name=="xaxis"||this.name=="x2axis"){k.data[u][0]=n}else{k.data[u][1]=n}}}if(this.groups>1&&!this._grouped){var r=y.length;var p=parseInt(r/this.groups,10);var e=0;for(var x=p;x<r;x+=p+1){y[x]=" "}this._grouped=true}w=B+0.5;if(this.numberTicks==null){this.numberTicks=2*B+1}var m=w-q;this.min=q;this.max=w;var o=0;var g=parseInt(3+v/10,10);var p=parseInt(B/g,10);if(this.tickInterval==null){this.tickInterval=m/(this.numberTicks-1)}for(var x=0;x<this.numberTicks;x++){b=this.min+x*this.tickInterval;var h=new this.tickRenderer(this.tickOptions);if(x/2==parseInt(x/2,10)){h.showLabel=false;h.showMark=true}else{if(p>0&&o<p){h.showLabel=false;o+=1}else{h.showLabel=true;o=0}h.label=h.formatter(h.formatString,y[(x-1)/2]);h.showMark=false;h.showGridline=false}h.setTick(b,this.name);this._ticks.push(h)}}};a.jqplot.CategoryAxisRenderer.prototype.draw=function(b,j){if(this.show){this.renderer.createTicks.call(this);var h=0;var c;if(this._elem){this._elem.emptyForce()}this._elem=this._elem||a('<div class="jqplot-axis jqplot-'+this.name+'" style="position:absolute;"></div>');if(this.name=="xaxis"||this.name=="x2axis"){this._elem.width(this._plotDimensions.width)}else{this._elem.height(this._plotDimensions.height)}this.labelOptions.axis=this.name;this._label=new this.labelRenderer(this.labelOptions);if(this._label.show){var g=this._label.draw(b,j);g.appendTo(this._elem)}var f=this._ticks;for(var e=0;e<f.length;e++){var d=f[e];if(d.showLabel&&(!d.isMinorTick||this.showMinorTicks)){var g=d.draw(b,j);g.appendTo(this._elem)}}this._groupLabels=[];for(var e=0;e<this.groupLabels.length;e++){var g=a('<div style="position:absolute;" class="jqplot-'+this.name+'-groupLabel"></div>');g.html(this.groupLabels[e]);this._groupLabels.push(g);g.appendTo(this._elem)}}return this._elem};a.jqplot.CategoryAxisRenderer.prototype.set=function(){var e=0;var m;var k=0;var f=0;var d=(this._label==null)?false:this._label.show;if(this.show){var n=this._ticks;for(var c=0;c<n.length;c++){var g=n[c];if(g.showLabel&&(!g.isMinorTick||this.showMinorTicks)){if(this.name=="xaxis"||this.name=="x2axis"){m=g._elem.outerHeight(true)}else{m=g._elem.outerWidth(true)}if(m>e){e=m}}}var j=0;for(var c=0;c<this._groupLabels.length;c++){var b=this._groupLabels[c];if(this.name=="xaxis"||this.name=="x2axis"){m=b.outerHeight(true)}else{m=b.outerWidth(true)}if(m>j){j=m}}if(d){k=this._label._elem.outerWidth(true);f=this._label._elem.outerHeight(true)}if(this.name=="xaxis"){e+=j+f;this._elem.css({height:e+"px",left:"0px",bottom:"0px"})}else{if(this.name=="x2axis"){e+=j+f;this._elem.css({height:e+"px",left:"0px",top:"0px"})}else{if(this.name=="yaxis"){e+=j+k;this._elem.css({width:e+"px",left:"0px",top:"0px"});if(d&&this._label.constructor==a.jqplot.AxisLabelRenderer){this._label._elem.css("width",k+"px")}}else{e+=j+k;this._elem.css({width:e+"px",right:"0px",top:"0px"});if(d&&this._label.constructor==a.jqplot.AxisLabelRenderer){this._label._elem.css("width",k+"px")}}}}}};a.jqplot.CategoryAxisRenderer.prototype.pack=function(e,c){var C=this._ticks;var v=this.max;var s=this.min;var n=c.max;var l=c.min;var q=(this._label==null)?false:this._label.show;var x;for(var r in e){this._elem.css(r,e[r])}this._offsets=c;var g=n-l;var k=v-s;this.p2u=function(h){return(h-l)*k/g+s};this.u2p=function(h){return(h-s)*g/k+l};if(this.name=="xaxis"||this.name=="x2axis"){this.series_u2p=function(h){return(h-s)*g/k};this.series_p2u=function(h){return h*k/g+s}}else{this.series_u2p=function(h){return(h-v)*g/k};this.series_p2u=function(h){return h*k/g+v}}if(this.show){if(this.name=="xaxis"||this.name=="x2axis"){for(x=0;x<C.length;x++){var o=C[x];if(o.show&&o.showLabel){var b;if(o.constructor==a.jqplot.CanvasAxisTickRenderer&&o.angle){var A=(this.name=="xaxis")?1:-1;switch(o.labelPosition){case"auto":if(A*o.angle<0){b=-o.getWidth()+o._textRenderer.height*Math.sin(-o._textRenderer.angle)/2}else{b=-o._textRenderer.height*Math.sin(o._textRenderer.angle)/2}break;case"end":b=-o.getWidth()+o._textRenderer.height*Math.sin(-o._textRenderer.angle)/2;break;case"start":b=-o._textRenderer.height*Math.sin(o._textRenderer.angle)/2;break;case"middle":b=-o.getWidth()/2+o._textRenderer.height*Math.sin(-o._textRenderer.angle)/2;break;default:b=-o.getWidth()/2+o._textRenderer.height*Math.sin(-o._textRenderer.angle)/2;break}}else{b=-o.getWidth()/2}var D=this.u2p(o.value)+b+"px";o._elem.css("left",D);o.pack()}}var z=["bottom",0];if(q){var m=this._label._elem.outerWidth(true);this._label._elem.css("left",l+g/2-m/2+"px");if(this.name=="xaxis"){this._label._elem.css("bottom","0px");z=["bottom",this._label._elem.outerHeight(true)]}else{this._label._elem.css("top","0px");z=["top",this._label._elem.outerHeight(true)]}this._label.pack()}var d=parseInt(this._ticks.length/this.groups,10);for(x=0;x<this._groupLabels.length;x++){var B=0;var f=0;for(var u=x*d;u<=(x+1)*d;u++){if(this._ticks[u]._elem&&this._ticks[u].label!=" "){var o=this._ticks[u]._elem;var r=o.position();B+=r.left+o.outerWidth(true)/2;f++}}B=B/f;this._groupLabels[x].css({left:(B-this._groupLabels[x].outerWidth(true)/2)});this._groupLabels[x].css(z[0],z[1])}}else{for(x=0;x<C.length;x++){var o=C[x];if(o.show&&o.showLabel){var b;if(o.constructor==a.jqplot.CanvasAxisTickRenderer&&o.angle){var A=(this.name=="yaxis")?1:-1;switch(o.labelPosition){case"auto":case"end":if(A*o.angle<0){b=-o._textRenderer.height*Math.cos(-o._textRenderer.angle)/2}else{b=-o.getHeight()+o._textRenderer.height*Math.cos(o._textRenderer.angle)/2}break;case"start":if(o.angle>0){b=-o._textRenderer.height*Math.cos(-o._textRenderer.angle)/2}else{b=-o.getHeight()+o._textRenderer.height*Math.cos(o._textRenderer.angle)/2}break;case"middle":b=-o.getHeight()/2;break;default:b=-o.getHeight()/2;break}}else{b=-o.getHeight()/2}var D=this.u2p(o.value)+b+"px";o._elem.css("top",D);o.pack()}}var z=["left",0];if(q){var y=this._label._elem.outerHeight(true);this._label._elem.css("top",n-g/2-y/2+"px");if(this.name=="yaxis"){this._label._elem.css("left","0px");z=["left",this._label._elem.outerWidth(true)]}else{this._label._elem.css("right","0px");z=["right",this._label._elem.outerWidth(true)]}this._label.pack()}var d=parseInt(this._ticks.length/this.groups,10);for(x=0;x<this._groupLabels.length;x++){var B=0;var f=0;for(var u=x*d;u<=(x+1)*d;u++){if(this._ticks[u]._elem&&this._ticks[u].label!=" "){var o=this._ticks[u]._elem;var r=o.position();B+=r.top+o.outerHeight()/2;f++}}B=B/f;this._groupLabels[x].css({top:B-this._groupLabels[x].outerHeight()/2});this._groupLabels[x].css(z[0],z[1])}}}}})(jQuery);





/**
 * jqPlot
 * Pure JavaScript plotting plugin using jQuery
 *
 * Version: 1.0.0b2_r1012
 *
 * Copyright (c) 2009-2011 Chris Leonello
 * jqPlot is currently available for use in all personal or commercial projects 
 * under both the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL 
 * version 2.0 (http://www.gnu.org/licenses/gpl-2.0.html) licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly. 
 *
 * Although not required, the author would appreciate an email letting him 
 * know of any substantial use of jqPlot.  You can reach the author at: 
 * chris at jqplot dot com or see http://www.jqplot.com/info.php .
 *
 * If you are feeling kind and generous, consider supporting the project by
 * making a donation at: http://www.jqplot.com/donate.php .
 *
 * sprintf functions contained in jqplot.sprintf.js by Ash Searle:
 *
 *     version 2007.04.27
 *     author Ash Searle
 *     http://hexmen.com/blog/2007/03/printf-sprintf/
 *     http://hexmen.com/js/sprintf.js
 *     The author (Ash Searle) has placed this code in the public domain:
 *     "This code is unrestricted: you are free to use it however you like."
 *
 * included jsDate library by Chris Leonello:
 *
 * Copyright (c) 2010-2011 Chris Leonello
 *
 * jsDate is currently available for use in all personal or commercial projects 
 * under both the MIT and GPL version 2.0 licenses. This means that you can 
 * choose the license that best suits your project and use it accordingly.
 *
 * jsDate borrows many concepts and ideas from the Date Instance 
 * Methods by Ken Snyder along with some parts of Ken's actual code.
 * 
 * Ken's origianl Date Instance Methods and copyright notice:
 * 
 * Ken Snyder (ken d snyder at gmail dot com)
 * 2008-09-10
 * version 2.0.2 (http://kendsnyder.com/sandbox/date/)     
 * Creative Commons Attribution License 3.0 (http://creativecommons.org/licenses/by/3.0/)
 *
 * jqplotToImage function based on Larry Siden's export-jqplot-to-png.js.
 * Larry has generously given permission to adapt his code for inclusion
 * into jqPlot.
 *
 * Larry's original code can be found here:
 *
 * https://github.com/lsiden/export-jqplot-to-png
 * 
 * 
 */
(function(d){d.jqplot.BarRenderer=function(){d.jqplot.LineRenderer.call(this)};d.jqplot.BarRenderer.prototype=new d.jqplot.LineRenderer();d.jqplot.BarRenderer.prototype.constructor=d.jqplot.BarRenderer;d.jqplot.BarRenderer.prototype.init=function(n,p){this.barPadding=8;this.barMargin=10;this.barDirection="vertical";this.barWidth=null;this.shadowOffset=2;this.shadowDepth=5;this.shadowAlpha=0.08;this.waterfall=false;this.groups=1;this.varyBarColor=false;this.highlightMouseOver=true;this.highlightMouseDown=false;this.highlightColors=[];this.transposedData=true;this.renderer.animation={show:false,direction:"down",speed:3000,_supported:true};this._type="bar";if(n.highlightMouseDown&&n.highlightMouseOver==null){n.highlightMouseOver=false}d.extend(true,this,n);d.extend(true,this.renderer,n);this.fill=true;if(this.barDirection==="horizontal"&&this.rendererOptions.animation&&this.rendererOptions.animation.direction==null){this.renderer.animation.direction="left"}if(this.waterfall){this.fillToZero=false;this.disableStack=true}if(this.barDirection=="vertical"){this._primaryAxis="_xaxis";this._stackAxis="y";this.fillAxis="y"}else{this._primaryAxis="_yaxis";this._stackAxis="x";this.fillAxis="x"}this._highlightedPoint=null;this._plotSeriesInfo=null;this._dataColors=[];this._barPoints=[];var o={lineJoin:"miter",lineCap:"round",fill:true,isarc:false,strokeStyle:this.color,fillStyle:this.color,closePath:this.fill};this.renderer.shapeRenderer.init(o);var m={lineJoin:"miter",lineCap:"round",fill:true,isarc:false,angle:this.shadowAngle,offset:this.shadowOffset,alpha:this.shadowAlpha,depth:this.shadowDepth,closePath:this.fill};this.renderer.shadowRenderer.init(m);p.postInitHooks.addOnce(h);p.postDrawHooks.addOnce(i);p.eventListenerHooks.addOnce("jqplotMouseMove",b);p.eventListenerHooks.addOnce("jqplotMouseDown",a);p.eventListenerHooks.addOnce("jqplotMouseUp",k);p.eventListenerHooks.addOnce("jqplotClick",e);p.eventListenerHooks.addOnce("jqplotRightClick",l)};function g(s,o,n,v){if(this.rendererOptions.barDirection=="horizontal"){this._stackAxis="x";this._primaryAxis="_yaxis"}if(this.rendererOptions.waterfall==true){this._data=d.extend(true,[],this.data);var r=0;var t=(!this.rendererOptions.barDirection||this.rendererOptions.barDirection==="vertical"||this.transposedData===false)?1:0;for(var p=0;p<this.data.length;p++){r+=this.data[p][t];if(p>0){this.data[p][t]+=this.data[p-1][t]}}this.data[this.data.length]=(t==1)?[this.data.length+1,r]:[r,this.data.length+1];this._data[this._data.length]=(t==1)?[this._data.length+1,r]:[r,this._data.length+1]}if(this.rendererOptions.groups>1){this.breakOnNull=true;var m=this.data.length;var u=parseInt(m/this.rendererOptions.groups,10);var q=0;for(var p=u;p<m;p+=u){this.data.splice(p+q,0,[null,null]);q++}for(p=0;p<this.data.length;p++){if(this._primaryAxis=="_xaxis"){this.data[p][0]=p+1}else{this.data[p][1]=p+1}}}}d.jqplot.preSeriesInitHooks.push(g);d.jqplot.BarRenderer.prototype.calcSeriesNumbers=function(){var q=0;var r=0;var p=this[this._primaryAxis];var o,n,t;for(var m=0;m<p._series.length;m++){n=p._series[m];if(n===this){t=m}if(n.renderer.constructor==d.jqplot.BarRenderer){q+=n.data.length;r+=1}}return[q,r,t]};d.jqplot.BarRenderer.prototype.setBarWidth=function(){var p;var m=0;var n=0;var r=this[this._primaryAxis];var w,q,u;var v=this._plotSeriesInfo=this.renderer.calcSeriesNumbers.call(this);m=v[0];n=v[1];var t=r.numberTicks;var o=(t-1)/2;if(r.name=="xaxis"||r.name=="x2axis"){if(this._stack){this.barWidth=(r._offsets.max-r._offsets.min)/m*n-this.barMargin}else{this.barWidth=((r._offsets.max-r._offsets.min)/o-this.barPadding*(n-1)-this.barMargin*2)/n}}else{if(this._stack){this.barWidth=(r._offsets.min-r._offsets.max)/m*n-this.barMargin}else{this.barWidth=((r._offsets.min-r._offsets.max)/o-this.barPadding*(n-1)-this.barMargin*2)/n}}return[m,n]};function f(n){var p=[];for(var r=0;r<n.length;r++){var q=d.jqplot.getColorComponents(n[r]);var m=[q[0],q[1],q[2]];var s=m[0]+m[1]+m[2];for(var o=0;o<3;o++){m[o]=(s>570)?m[o]*0.8:m[o]+0.3*(255-m[o]);m[o]=parseInt(m[o],10)}p.push("rgb("+m[0]+","+m[1]+","+m[2]+")")}return p}d.jqplot.BarRenderer.prototype.draw=function(D,J,p){var G;var z=d.extend({},p);var u=(z.shadow!=undefined)?z.shadow:this.shadow;var M=(z.showLine!=undefined)?z.showLine:this.showLine;var E=(z.fill!=undefined)?z.fill:this.fill;var o=this.xaxis;var H=this.yaxis;var x=this._xaxis.series_u2p;var I=this._yaxis.series_u2p;var C,B;this._dataColors=[];this._barPoints=[];if(this.barWidth==null){this.renderer.setBarWidth.call(this)}var L=this._plotSeriesInfo=this.renderer.calcSeriesNumbers.call(this);var w=L[0];var v=L[1];var r=L[2];var F=[];if(this._stack){this._barNudge=0}else{this._barNudge=(-Math.abs(v/2-0.5)+r)*(this.barWidth+this.barPadding)}if(M){var t=new d.jqplot.ColorGenerator(this.negativeSeriesColors);var A=new d.jqplot.ColorGenerator(this.seriesColors);var K=t.get(this.index);if(!this.useNegativeColors){K=z.fillStyle}var s=z.fillStyle;var q;var N;var n;if(this.barDirection=="vertical"){for(var G=0;G<J.length;G++){if(this.data[G][1]==null){continue}F=[];q=J[G][0]+this._barNudge;n;if(this._stack&&this._prevGridData.length){n=this._prevGridData[G][1]}else{if(this.fillToZero){n=this._yaxis.series_u2p(0)}else{if(this.waterfall&&G>0&&G<this.gridData.length-1){n=this.gridData[G-1][1]}else{if(this.waterfall&&G==0&&G<this.gridData.length-1){if(this._yaxis.min<=0&&this._yaxis.max>=0){n=this._yaxis.series_u2p(0)}else{if(this._yaxis.min>0){n=D.canvas.height}else{n=0}}}else{if(this.waterfall&&G==this.gridData.length-1){if(this._yaxis.min<=0&&this._yaxis.max>=0){n=this._yaxis.series_u2p(0)}else{if(this._yaxis.min>0){n=D.canvas.height}else{n=0}}}else{n=D.canvas.height}}}}}if((this.fillToZero&&this._plotData[G][1]<0)||(this.waterfall&&this._data[G][1]<0)){if(this.varyBarColor&&!this._stack){if(this.useNegativeColors){z.fillStyle=t.next()}else{z.fillStyle=A.next()}}else{z.fillStyle=K}}else{if(this.varyBarColor&&!this._stack){z.fillStyle=A.next()}else{z.fillStyle=s}}if(!this.fillToZero||this._plotData[G][1]>=0){F.push([q-this.barWidth/2,n]);F.push([q-this.barWidth/2,J[G][1]]);F.push([q+this.barWidth/2,J[G][1]]);F.push([q+this.barWidth/2,n])}else{F.push([q-this.barWidth/2,J[G][1]]);F.push([q-this.barWidth/2,n]);F.push([q+this.barWidth/2,n]);F.push([q+this.barWidth/2,J[G][1]])}this._barPoints.push(F);if(u&&!this._stack){var y=d.extend(true,{},z);delete y.fillStyle;this.renderer.shadowRenderer.draw(D,F,y)}var m=z.fillStyle||this.color;this._dataColors.push(m);this.renderer.shapeRenderer.draw(D,F,z)}}else{if(this.barDirection=="horizontal"){for(var G=0;G<J.length;G++){if(this.data[G][0]==null){continue}F=[];q=J[G][1]-this._barNudge;N;if(this._stack&&this._prevGridData.length){N=this._prevGridData[G][0]}else{if(this.fillToZero){N=this._xaxis.series_u2p(0)}else{if(this.waterfall&&G>0&&G<this.gridData.length-1){N=this.gridData[G-1][1]}else{if(this.waterfall&&G==0&&G<this.gridData.length-1){if(this._xaxis.min<=0&&this._xaxis.max>=0){N=this._xaxis.series_u2p(0)}else{if(this._xaxis.min>0){N=0}else{N=D.canvas.width}}}else{if(this.waterfall&&G==this.gridData.length-1){if(this._xaxis.min<=0&&this._xaxis.max>=0){N=this._xaxis.series_u2p(0)}else{if(this._xaxis.min>0){N=0}else{N=D.canvas.width}}}else{N=0}}}}}if((this.fillToZero&&this._plotData[G][1]<0)||(this.waterfall&&this._data[G][1]<0)){if(this.varyBarColor&&!this._stack){if(this.useNegativeColors){z.fillStyle=t.next()}else{z.fillStyle=A.next()}}}else{if(this.varyBarColor&&!this._stack){z.fillStyle=A.next()}else{z.fillStyle=s}}if(!this.fillToZero||this._plotData[G][0]>=0){F.push([N,q+this.barWidth/2]);F.push([N,q-this.barWidth/2]);F.push([J[G][0],q-this.barWidth/2]);F.push([J[G][0],q+this.barWidth/2])}else{F.push([J[G][0],q+this.barWidth/2]);F.push([J[G][0],q-this.barWidth/2]);F.push([N,q-this.barWidth/2]);F.push([N,q+this.barWidth/2])}this._barPoints.push(F);if(u&&!this._stack){var y=d.extend(true,{},z);delete y.fillStyle;this.renderer.shadowRenderer.draw(D,F,y)}var m=z.fillStyle||this.color;this._dataColors.push(m);this.renderer.shapeRenderer.draw(D,F,z)}}}}if(this.highlightColors.length==0){this.highlightColors=d.jqplot.computeHighlightColors(this._dataColors)}else{if(typeof(this.highlightColors)=="string"){var L=this.highlightColors;this.highlightColors=[];for(var G=0;G<this._dataColors.length;G++){this.highlightColors.push(L)}}}};d.jqplot.BarRenderer.prototype.drawShadow=function(y,E,o){var B;var v=(o!=undefined)?o:{};var r=(v.shadow!=undefined)?v.shadow:this.shadow;var G=(v.showLine!=undefined)?v.showLine:this.showLine;var z=(v.fill!=undefined)?v.fill:this.fill;var n=this.xaxis;var C=this.yaxis;var u=this._xaxis.series_u2p;var D=this._yaxis.series_u2p;var x,A,w,t,s,q;if(this._stack&&this.shadow){if(this.barWidth==null){this.renderer.setBarWidth.call(this)}var F=this._plotSeriesInfo=this.renderer.calcSeriesNumbers.call(this);t=F[0];s=F[1];q=F[2];if(this._stack){this._barNudge=0}else{this._barNudge=(-Math.abs(s/2-0.5)+q)*(this.barWidth+this.barPadding)}if(G){if(this.barDirection=="vertical"){for(var B=0;B<E.length;B++){if(this.data[B][1]==null){continue}A=[];var p=E[B][0]+this._barNudge;var m;if(this._stack&&this._prevGridData.length){m=this._prevGridData[B][1]}else{if(this.fillToZero){m=this._yaxis.series_u2p(0)}else{m=y.canvas.height}}A.push([p-this.barWidth/2,m]);A.push([p-this.barWidth/2,E[B][1]]);A.push([p+this.barWidth/2,E[B][1]]);A.push([p+this.barWidth/2,m]);this.renderer.shadowRenderer.draw(y,A,v)}}else{if(this.barDirection=="horizontal"){for(var B=0;B<E.length;B++){if(this.data[B][0]==null){continue}A=[];var p=E[B][1]-this._barNudge;var H;if(this._stack&&this._prevGridData.length){H=this._prevGridData[B][0]}else{H=0}A.push([H,p+this.barWidth/2]);A.push([E[B][0],p+this.barWidth/2]);A.push([E[B][0],p-this.barWidth/2]);A.push([H,p-this.barWidth/2]);this.renderer.shadowRenderer.draw(y,A,v)}}}}}};function h(p,o,m){for(var n=0;n<this.series.length;n++){if(this.series[n].renderer.constructor==d.jqplot.BarRenderer){if(this.series[n].highlightMouseOver){this.series[n].highlightMouseDown=false}}}}function i(){if(this.plugins.barRenderer&&this.plugins.barRenderer.highlightCanvas){this.plugins.barRenderer.highlightCanvas.resetCanvas();this.plugins.barRenderer.highlightCanvas=null}this.plugins.barRenderer={highlightedSeriesIndex:null};this.plugins.barRenderer.highlightCanvas=new d.jqplot.GenericCanvas();this.eventCanvas._elem.before(this.plugins.barRenderer.highlightCanvas.createElement(this._gridPadding,"jqplot-barRenderer-highlight-canvas",this._plotDimensions,this));this.plugins.barRenderer.highlightCanvas.setContext();this.eventCanvas._elem.bind("mouseleave",{plot:this},function(m){j(m.data.plot)})}function c(t,r,p,o){var n=t.series[r];var m=t.plugins.barRenderer.highlightCanvas;m._ctx.clearRect(0,0,m._ctx.canvas.width,m._ctx.canvas.height);n._highlightedPoint=p;t.plugins.barRenderer.highlightedSeriesIndex=r;var q={fillStyle:n.highlightColors[p]};n.renderer.shapeRenderer.draw(m._ctx,o,q);m=null}function j(o){var m=o.plugins.barRenderer.highlightCanvas;m._ctx.clearRect(0,0,m._ctx.canvas.width,m._ctx.canvas.height);for(var n=0;n<o.series.length;n++){o.series[n]._highlightedPoint=null}o.plugins.barRenderer.highlightedSeriesIndex=null;o.target.trigger("jqplotDataUnhighlight");m=null}function b(q,p,t,s,r){if(s){var o=[s.seriesIndex,s.pointIndex,s.data];var n=jQuery.Event("jqplotDataMouseOver");n.pageX=q.pageX;n.pageY=q.pageY;r.target.trigger(n,o);if(r.series[o[0]].highlightMouseOver&&!(o[0]==r.plugins.barRenderer.highlightedSeriesIndex&&o[1]==r.series[o[0]]._highlightedPoint)){var m=jQuery.Event("jqplotDataHighlight");m.pageX=q.pageX;m.pageY=q.pageY;r.target.trigger(m,o);c(r,s.seriesIndex,s.pointIndex,s.points)}}else{if(s==null){j(r)}}}function a(p,o,s,r,q){if(r){var n=[r.seriesIndex,r.pointIndex,r.data];if(q.series[n[0]].highlightMouseDown&&!(n[0]==q.plugins.barRenderer.highlightedSeriesIndex&&n[1]==q.series[n[0]]._highlightedPoint)){var m=jQuery.Event("jqplotDataHighlight");m.pageX=p.pageX;m.pageY=p.pageY;q.target.trigger(m,n);c(q,r.seriesIndex,r.pointIndex,r.points)}}else{if(r==null){j(q)}}}function k(o,n,r,q,p){var m=p.plugins.barRenderer.highlightedSeriesIndex;if(m!=null&&p.series[m].highlightMouseDown){j(p)}}function e(p,o,s,r,q){if(r){var n=[r.seriesIndex,r.pointIndex,r.data];var m=jQuery.Event("jqplotDataClick");m.pageX=p.pageX;m.pageY=p.pageY;q.target.trigger(m,n)}}function l(q,p,t,s,r){if(s){var o=[s.seriesIndex,s.pointIndex,s.data];var m=r.plugins.barRenderer.highlightedSeriesIndex;if(m!=null&&r.series[m].highlightMouseDown){j(r)}var n=jQuery.Event("jqplotDataRightClick");n.pageX=q.pageX;n.pageY=q.pageY;r.target.trigger(n,o)}}})(jQuery);