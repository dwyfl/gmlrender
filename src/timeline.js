import {GML} from 'gmljs';
import {EventEmitter} from 'eventemitter3';

const EVENT_START = 'event_start';
const EVENT_STOP = 'event_stop';
const EVENT_UPDATE = 'event_update';

const GML_RESTART_DELAY = 1000;
const GML_CONSTANT_FPS = 1/60;
const GML_TIME = (function(){
	return typeof(performance) == 'object' && typeof(performance.now) == 'function'
		? function(){ return performance.now(); }
		: function(){ return Date.now(); };
})();

export default class Timeline extends EventEmitter {
	constructor(gml, options) {
		super();
		// Timeline with frame data
		this.timeline = typeof(gml) != 'undefined' ? getTimeline(gml, options) : [];
		// State vars
		this.currentIndex = 0;
		this.currentTime = 0;
		this.lastStepTime = 0;
		this.scheduledRestart = null;
		this.animationRequest = null;
		this.running = false;
		// Settings
		this.speed = 1;
		this.loop = true;
	}
	static get EVENT_START() {
		return EVENT_START;
	}
	static get EVENT_STOP() {
		return EVENT_STOP;
	}
	static get EVENT_UPDATE() {
		return EVENT_UPDATE;
	}
	get length() {
		return this.timeline.length;
	}
	unload() {
		this.removeAllListeners();
	}
	getState() {
		return {
			timeline: this.timeline,
			frame: this.getFrame(this.currentIndex),
			frameIndex: this.currentIndex,
			time: this.currentTime,
			totalFrames: this.timeline.length,
			totalTime: this.getTotalTime()
		};
	}
	isRunning() {
		return this.running;
	}
	isEmpty() {
		return this.timeline.length === 0;
	}
	getLastIndex() {
		return Math.max(0, this.timeline.length - 1);
	}
	getTotalTime() {
		return this.isEmpty() ? 0 : this.getTime(this.getLastIndex());
	}
	getFrames() {
		return this.timeline;
	}
	getFrame(index) {
		if (typeof(index) == 'undefined') {
			index = this.currentIndex;
		}
		index = Math.max(0, Math.min(this.getLastIndex(), index));
		return this.isEmpty() ? null : this.timeline[index];
	}
	getTime(index) {
		if (typeof(index) == 'undefined') {
			return this.currentTime;
		}
		const frame = this.getFrame(index);
		return frame === null ? 0 : frame.t;
	}
	getIndex(time) {
		if (typeof(time) == 'undefined') {
			return this.currentIndex;
		}
		let index;
		for (index = 0; index < this.timeline.length; ++index) {
			if (time < this.timeline[index].t){
				--index;
				break;
			}
		}
		return Math.max(0, Math.min(index, this.timeline.length));
	}
	setIndex(index, time) {
		const sameIndex = this.currentIndex === index || typeof(index) == 'undefined';
		const sameTime = this.currentTime === time || typeof(time) == 'undefined';
		if (sameIndex && sameTime) {
			return;
		}
		if (this.isEmpty()) {
			this.currentIndex = 0;
			this.currentTime = 0;
		} else {
			index = Math.min(Math.max(index, 0), this.getLastIndex());
			this.currentIndex = index;
			this.currentTime = typeof(time) != 'undefined' ? time : this.getTime(index);
		}
		this.emit(EVENT_UPDATE, this.getState());
	}
	setLoop(value) {
		this.loop = !!value;
	}
	setSpeed(value) {
		this.speed = isNaN(value) ? 1.0 : Math.max(0, Math.min(100, value));
	}
	start() {
		this._run();
	}
	stop() {
		this._runComplete(false);
	}
	_cancelRestart() {
		if (this.scheduledRestart)
			clearTimeout(this.scheduledRestart);
		this.scheduledRestart = null;
	}
	_cancelStep() {
		if (this.animationRequest)
			window.cancelAnimationFrame(this.animationRequest);
		this.animationRequest = null;
	}
	_run() {
		if (this.isEmpty())
			return;
		this._cancelRestart();
		this.lastStepTime = GML_TIME();
		this.running = true;
		this.animationRequest = window.requestAnimationFrame(this._runStep.bind(this));
		this.emit(EVENT_START, this.getState());
	}
	_runStep(time) {
		let shouldUpdate = false;
		let deltaTime = time - this.lastStepTime;
		let lastIndex = this.getLastIndex();
		let nextTime;
		this.lastStepTime = time;
		this.currentTime += deltaTime * 0.001 * this.speed;
		while (this.currentIndex < lastIndex) {
			nextTime = this.getTime(this.currentIndex + 1);
			if (this.currentTime < nextTime)
				break;
			this.currentIndex++;
			shouldUpdate = true;
		}
		if (shouldUpdate) {
			this.emit(EVENT_UPDATE, this.getState());
		}
		if (this.currentIndex >= this.getLastIndex()) {
			this._runComplete(this.loop);
		}
		if (this.running) {
			this.animationRequest = window.requestAnimationFrame(this._runStep.bind(this));
		}
	}
	_runComplete(scheduleRestart) {
		if (typeof(scheduleRestart) === 'undefined')
			scheduleRestart = true;
		// _cancelStep() should be moved into timeout callback, for example to animate
		// drips after finish. But, that would require a completed-bool or similar.
		this._cancelStep();
		this.running = false;
		if (this.loop && scheduleRestart) {
			this.scheduledRestart = setTimeout(() => {
				this.currentIndex = 0;
				this.currentTime = 0;
				this.start();
			}, GML_RESTART_DELAY);
		}
		this.emit(EVENT_STOP, this.getState());
	}
}

/**
 * Calculate a linear timeline for all points.
 * @param {array} options
 *        includeAllTags - Default is to only read the first tag in the document.
 *        useConstantFps - Ignore time data.
 * @return {array}
 */
function getTimeline(gml, options) {
	if (typeof(options) == 'undefined')
		options = {};
	if (typeof(options.includeAllTags) == 'undefined')
		options.includeAllTags = false;
	if (typeof(options.useConstantFps) == 'undefined')
		options.useConstantFps = false;
	var timeline = [];
	var tags = gml.getTags();
	var tagLimit = tags && tags.length ? tags.length : 0;
	if (!options.includeAllTags)
		tagLimit = Math.min(1, tagLimit);
	var constantTimeOffset = 0;
	for (var i = 0; tags && i < tagLimit; ++i) {
		var currentTag = tags[i];
		if (!currentTag)
			continue;
		var drawings = currentTag.drawing;
		if (!drawings || !drawings.length)
			continue;
		var drawingTimeOffset = 0;
		var currentPointTime = 0;
		for (var j = 0; j < drawings.length; ++j) {
			var currentDrawing = drawings[j];
			var previousPointTime = 0;
			if (!currentDrawing)
				continue;
			var strokes = currentDrawing.stroke;
			if (!strokes || !strokes.length)
				continue;
			for (var k = 0; k < strokes.length; ++k) {
				var currentStroke = strokes[k];
				if (!currentStroke.pt || !currentStroke.pt.length)
					continue;
				var previousPoint = null;
				var currentPoint = null;
				var dx, dy, dz, dt, len, speed, direction;
				for (var l = 0; l < currentStroke.pt.length; ++l) {
					currentPoint = currentStroke.pt[l];
					currentPointTime = Math.max(previousPointTime, currentPoint.t);
					if (previousPoint) {
						dt = currentPointTime - previousPointTime;
						dx = currentPoint.x - previousPoint.x;
						dy = currentPoint.y - previousPoint.y;
						dz = !isNaN(currentPoint.z) && !isNaN(previousPoint.z)
							? currentPoint.z - previousPoint.z
							: 0;
						len = Math.sqrt((dx*dx)+(dy*dy));
						direction = { x: dx/len, y: dy/len, z: dz };
						speed = dt > 0 ? len/dt : 0;
					} else {
						direction = { x: 0, y: 0, z: 0 };
						speed = 0;
					}
					timeline.push({
						t: options.useConstantFps
							? constantTimeOffset
							: drawingTimeOffset + currentPointTime,
						tag: i,
						drawing: j,
						stroke: k,
						point: l,
						speed: speed,
						direction: direction
					});
					constantTimeOffset += GML_CONSTANT_FPS;
					previousPointTime = currentPointTime;
					previousPoint = currentPoint;
				}
			}
			drawingTimeOffset += currentPointTime;
		}
	}
	return timeline;
}