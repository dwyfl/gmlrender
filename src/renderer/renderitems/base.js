import {vec3} from 'gl-matrix';

const CENTER_POINT = vec3.fromValues(0.5, 0.5, 0);

export default class RenderItem {
	constructor(canvas, gml, clientEnvironment, tagEnvironments) {
		this.canvas = canvas;
		this.gml = gml;
		this.clientEnvironment = clientEnvironment;
		this.tagEnvironments = tagEnvironments;
	}
	render(state) {
		// ...
	}
	getType() {
		return 'unknown';
	}
	_projectPoint(p, point, tagIndex, useTagOffset) {
		if (typeof(useTagOffset) === 'undefined') {
			useTagOffset = true;
		}
		const tagEnv = this.tagEnvironments[tagIndex];
		vec3.set(p,
			point.x,
			point.y,
			isNaN(point.z) ? 0 : point.z
		);
		// Center in tag space
		vec3.sub(p, p, CENTER_POINT);
		// Apply tag transform
		vec3.transformMat3(p, p, tagEnv.getTransform());
		// Transform to screen space
		vec3.mul(p, p, this.clientEnvironment.getScreenBounds());
		if (useTagOffset) {
			// Apply tag offset
			vec3.add(p, p, tagEnv.getOffset());
		}
		// Apply user transform
		vec3.transformMat3(p, p, this.clientEnvironment.getTransform());
		// Center in screen space
		vec3.add(p, p, this.clientEnvironment.getScreenCenter());
		// Apply user offset
		vec3.add(p, p, this.clientEnvironment.getOffset());
	}
}