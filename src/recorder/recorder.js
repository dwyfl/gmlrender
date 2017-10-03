(function(global){
/*
	"use strict";

	function GMLRecorder(canvas){
		this.canvas = null;
		this.canvasContext = null;
		this.canvasFillStyle = '#333';
		this.canvasStrokeStyle = '#333';
		this.canvasLineWidth = 3;
		this.canvasLineCap = 'round';
		this.canvasMouseDownHandler = null;
		this.virtualWidthFactor = 1.0;
		this.virtualHeightFactor = 1.0;
		this.virtualWidth = null;
		this.virtualHeight = null;
		this.strokes = null;
		this.currentStroke = null;
		this.startTime = null;
		this.lastPoint = null;
		this.gml = null;
		if (canvas)
			this.setCanvas(canvas);
	};
	GMLRecorder.FULL_VIRTUAL_WIDTH = 1920;
	GMLRecorder.FULL_VIRTUAL_HEIGHT = 1080;
	GMLRecorder.CANVAS_BACKGROUND = 'rgba(240, 240, 240, 1)';
	GMLRecorder.time = (function(){
		return typeof(performance) == 'object' && typeof(performance.now) == 'function' ?
			function(){ return performance.now(); } :
			function(){ return (new Date()).getTime(); };
	})();
	GMLRecorder.truncateNumber = function(value, precision){
		return value.toString().substr(0, 2+precision);
	};
	GMLRecorder.prototype.setContextBackgroundDrawStyles = function(){
		if (this.canvasContext) {
			this.canvasContext.fillStyle = GMLRecorder.CANVAS_BACKGROUND;
		}
	};
	GMLRecorder.prototype.setContextScreenBoundsDrawStyles = function(){
		if (this.canvasContext) {
			this.canvasContext.fillStyle = '#fff';
		}
	};
	GMLRecorder.prototype.setContextTagDrawStyles = function(){
		if (this.canvasContext) {
			this.canvasContext.fillStyle = this.canvasFillStyle;
			this.canvasContext.strokeStyle = this.canvasStrokeStyle;
			this.canvasContext.lineWidth = this.canvasLineWidth;
			this.canvasContext.lineCap = this.canvasLineCap;
		}
	};
	GMLRecorder.prototype.setCanvas = function(canvas){
		this.canvas = typeof(canvas) == 'string' ? document.getElementById(canvas) : canvas;
		if (this.canvas && this.canvas.getContext) {
			this.canvasContext = this.canvas.getContext('2d');
		} else {
			console.error('GMLRecorder: Unable to find/create canvas.');
			this.canvas = this.canvasContext = null;
		}
	};
	GMLRecorder.prototype.setupVirtualScreen = function(){
		var dx = GMLRecorder.FULL_VIRTUAL_WIDTH / this.canvas.width;
		var dy = GMLRecorder.FULL_VIRTUAL_HEIGHT / this.canvas.height;
		if (dx > 1 || dy > 1) {
			var s = 0.9 / Math.max(dy, dx);
			dx *= s;
			dy *= s;
		} else if (dx < 1 && dy < 1) {
			var s = 0.9 / Math.max(dy, dx);
			dx *= s;
			dy *= s;
		}
		this.virtualWidthFactor = dx;
		this.virtualHeightFactor = dy;
		this.virtualWidth = this.virtualWidthFactor * this.canvas.width;
		this.virtualHeight = this.virtualHeightFactor * this.canvas.height;
	};
	GMLRecorder.prototype.beginStroke = function(x, y){
		this.currentStroke = [];
		this.lastPoint = null;
		this.addPointToStroke(x, y);
	};
	GMLRecorder.prototype.addPointToStroke = function(x, y, force){
		if (typeof(force) == 'undefined')
			force = false;
		if (this.lastPoint && this.lastPoint.x == x && this.lastPoint.y == y && !force)
			return;
		this.canvasContext.beginPath();
		if (this.lastPoint)
			this.canvasContext.moveTo(this.lastPoint.x, this.lastPoint.y);
		else 
			this.canvasContext.moveTo(x+0.001, y+0.001);
		this.canvasContext.lineTo(x, y);
		this.canvasContext.stroke();
		this.lastPoint = { x: x, y: y };
		var sx = ((x - (this.canvas.width * 0.5)) / this.virtualWidth) + 0.5;
		var sy = ((y - (this.canvas.height * 0.5)) / this.virtualHeight) + 0.5;
		var st = (GMLRecorder.time() - this.startTime) * 0.001;
		this.currentStroke.push({
			x: GMLRecorder.truncateNumber(Math.min(Math.max(sx, 0), 1), 6),
			y: GMLRecorder.truncateNumber(Math.min(Math.max(sy, 0), 1), 6),
			z: 0,
			t: GMLRecorder.truncateNumber(st, 6+Math.floor(Math.log(st)))
		});
	};
	GMLRecorder.prototype.endStroke = function(x, y){
		while (this.currentStroke.length < 2)
			this.addPointToStroke(x+0.001, y+0.001, true);
		this.strokes.push(this.currentStroke);
		this.currentStroke = null;
	};
	GMLRecorder.prototype.start = function(){
		if (!this.canvas || !this.canvasContext) {
			console.error('GMLRecorder: Canvas missing.');
			return;
		}
		var self = this;
		var onMouseMove = function(e){
			self.addPointToStroke(e.clientX, e.clientY);
		};
		var onMouseUp = function(e){
			window.removeEventListener('mouseup', onMouseUp);
			self.canvas.removeEventListener('mousemove', onMouseMove);
			self.endStroke(e.clientX, e.clientY);
		};
		var onMouseDown = function(e){
			if (self.canvas == e.target) {
				if (self.startTime === null)
					self.startTime = GMLRecorder.time();
				self.beginStroke(e.clientX, e.clientY);
				window.addEventListener('mouseup', onMouseUp, false);
				self.canvas.addEventListener('mousemove', onMouseMove, false);
				e.preventDefault();
			}
		};
		this.strokes = [];
		this.startTime = null;
		this.gml = null;
		this.setupVirtualScreen();
		this.setContextBackgroundDrawStyles();
		this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.setContextScreenBoundsDrawStyles();
		this.canvasContext.fillRect(
			(this.canvas.width-this.virtualWidth) * 0.5,
			(this.canvas.height-this.virtualHeight) * 0.5,
			this.virtualWidth,
			this.virtualHeight
		);
		this.setContextTagDrawStyles();
		this.canvasMouseDownHandler = onMouseDown;
		this.canvas.addEventListener('mousedown', this.canvasMouseDownHandler, false);
	};
	GMLRecorder.prototype.stop = function(){
		this.canvas.removeEventListener('mousedown', this.canvasMouseDownHandler);
		this.canvasMouseDownHandler = null;
		this.currentStroke = null;
		this.startTime = null;
		if (this.strokes.length)
			this.gml = GML.createFromPointArrays(this.strokes);
	};

	if (typeof(global.GMLRecorder) == 'undefined')
		global.GMLRecorder = GMLRecorder;
*/
})(this);