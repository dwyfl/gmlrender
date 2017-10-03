import {vec3} from 'gl-matrix';
import RenderItem from './base';
import RenderHelper from '../helper';

const p = vec3.create();
const CENTER_POINT = vec3.fromValues(0.5, 0.5, 0);
const CORNER_POINTS = [
	{ x: 0, y: 0, z: 0 },
	{ x: 0, y: 1, z: 0 },
	{ x: 1, y: 1, z: 0 },
	{ x: 1, y: 0, z: 0 },
	{ x: 0, y: 0, z: 0 }
];

export default class RenderItemBackground extends RenderItem {
	render(state) {
		const tag = state ? state.frame.tag : 0;
		const tagEnv = this.tagEnvironments[tag];
		const context = this.canvas._canvasContext();
		this.canvas.setContextScreenBoundsDrawStyles();
		context.beginPath();
		for (var j = 0; j < CORNER_POINTS.length; ++j) {
			this._projectPoint(p, CORNER_POINTS[j], tag, false);
			if (j == 0) {
				context.moveTo(p[0], p[1]);
			} else {
				context.lineTo(p[0], p[1]);
			}
		}
		context.fill();
	}
	getType() {
		return 'background';
	}
}