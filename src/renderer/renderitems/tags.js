import {vec3} from 'gl-matrix';
import RenderItem from './base';
import RenderHelper from '../helper';

const p = vec3.create();
const q = vec3.create();
const pDir = vec3.create();
const pWidth = vec3.create();
const pPartial = vec3.create();

export default class RenderItemTags extends RenderItem {
	getType() {
		return 'tags';
	}
	_render(state) {
		const limit = state ? state.frameIndex : 
		this.gml.getPoints(tag, drawing, stroke, point)
		for (let i = 0; i <= state.frameIndex; ++i) {
		}
	}


	render(state) {
		this.canvas.setCanvasContextProps({
			fillStyle: "#666",
			// strokeStyle: this.canvasStrokeStyle,
			lineWidth: 0
		});
		const tags = this.gml.getTags();
		const tagLimit = this._useStateLimit(state)
			? state.frame.tag
			: tags.length - 1;
		for (let i = 0; i <= tagLimit; ++i) {
			const currentTag = tags[i];
			if (!currentTag.drawing || !currentTag.drawing.length) {
				continue;
			}
			this._renderTag(state, i, currentTag);
		}
	}
	_renderTag(state, tagIndex, currentTag) {
		const drawingLimit = this._useStateLimit(state, tagIndex)
			? state.frame.drawing
			: currentTag.drawing.length - 1;
		for (let i = 0; i <= drawingLimit; ++i) {
			const currentDrawing = currentTag.drawing[i];
			if (!currentDrawing.stroke || !currentDrawing.stroke.length) {
				continue;
			}
			this._renderDrawing(state, tagIndex, i, currentDrawing);
		}
	}
	_renderDrawing(state, tagIndex, drawingIndex, currentDrawing) {
		const strokeLimit = this._useStateLimit(state, tagIndex, drawingIndex)
			? state.frame.stroke
			: currentDrawing.stroke.length - 1;
		for (let i = 0; i <= strokeLimit; ++i) {
			var currentStroke = currentDrawing.stroke[i];
			if (!currentStroke.isDrawing)
				continue;
			if (!currentStroke.pt || !currentStroke.pt.length)
				continue;
			this._renderStroke(state, tagIndex, drawingIndex, i, currentStroke);
		}
	}
	_renderStroke(state, tagIndex, drawingIndex, strokeIndex, currentStroke) {
		const context = this.canvas._canvasContext();
		const pointLimit = this._useStateLimit(state, tagIndex, drawingIndex, strokeIndex)
			? state.frame.point
			: currentStroke.pt.length - 1;
		let strokeWidth = 5 * 0.5;
		for (let i = 0; i < pointLimit; ++i) {
			this._projectPoint(p, currentStroke.pt[i], tagIndex);
			this._projectPoint(q, currentStroke.pt[i + 1], tagIndex);
			vec3.sub(pDir, q, p);
			vec3.set(pWidth, -pDir[1], pDir[0], pDir[2]);
			vec3.scale(pWidth, pWidth, strokeWidth / vec3.length(pWidth));
			if (state && i == pointLimit && i < currentStroke.pt.length - 1) {
				var ct = currentStroke.pt[i].t,
					nt = currentStroke.pt[i + 1].t,
					dt = ct >= nt ? 0 : (state.time - ct) / (nt - ct);
				vec3.lerp(pPartial, p, q, dt);
			}
			else {
				vec3.copy(pPartial, q);
			}
			context.beginPath();
			context.moveTo(p[0] - pWidth[0], p[1] - pWidth[1]);
			context.lineTo(pPartial[0] - pWidth[0], pPartial[1] - pWidth[1]);
			context.lineTo(pPartial[0] + pWidth[0], pPartial[1] + pWidth[1]);
			context.lineTo(p[0] + pWidth[0], p[1] + pWidth[1]);
			context.closePath();
			context.fill();


			/*this._projectPoint(p, currentStroke.pt[i], tagIndex);
			if (i == 0) {
				context.moveTo(p[0], p[1]);
			} else {
				context.lineTo(p[0], p[1]);
			}
			if (state && i == pointLimit && i < currentStroke.pt.length - 1) {
				this._projectPoint(q, currentStroke.pt[i + 1], tagIndex);
				var ct = currentStroke.pt[i].t,
					nt = currentStroke.pt[i + 1].t,
					dt = ct >= nt ? 0 : (state.time - ct) / (nt - ct);
				var dx = p[0] + ((q[0] - p[0]) * dt);
				var dy = p[1] + ((q[1] - p[1]) * dt);
				context.lineTo(dx, dy);
			}*/
		}
		// context.stroke();
		// context.fill();
	}
	_useStateLimit(state, tagIndex, drawingIndex, strokeIndex) {
		if (!state) {
			return false;
		}
		let result = true;
		if (typeof(tagIndex) !== 'undefined') {
			result = result && tagIndex >= state.frame.tag;
		}
		if (typeof(drawingIndex) !== 'undefined') {
			result = result && drawingIndex >= state.frame.drawing;
		}
		if (typeof(strokeIndex) !== 'undefined') {
			result = result && strokeIndex >= state.frame.stroke;
		}
		return result;
	}
}