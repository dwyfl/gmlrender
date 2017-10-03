import {mat3, vec3} from 'gl-matrix';

// Most older apps have a 4:3 screen format, so use this as default.
const DEFAULT_SCREEN_BOUNDS = vec3.fromValues(1024, 768, 0);

export default class Environment {
	constructor(screenBounds, transform, offset) {
		this.screenBounds = vec3.create();
		this.screenCenter = vec3.create();
		this.setScreenBounds(typeof(screenBounds) === 'undefined'
			? DEFAULT_SCREEN_BOUNDS
			: screenBounds
		);
		this.transform = typeof(transform) === 'undefined'
			? mat3.create()
			: transform;
		this.offset = typeof(offset) === 'undefined'
			? vec3.create()
			: offset;
	}
	getScreenBounds() {
		return this.screenBounds;
	}
	getScreenCenter() {
		return this.screenCenter;
	}
	getTransform() {
		return this.transform;
	}
	getOffset() {
		return this.offset;
	}
	setScreenBounds(bounds) {
		vec3.copy(this.screenBounds, bounds);
		vec3.set(this.screenCenter, bounds[0] * 0.5, bounds[1] * 0.5, 0);
	}
	setScreenBoundsValues(width, height) {
		vec3.set(this.screenBounds, width, height, 0);
		vec3.set(this.screenCenter, width * 0.5, height * 0.5, 0);
	}
	setTransform(transform) {
		mat3.copy(this.transform, transform);
	}
	setOffset(offset) {
		vec3.copy(this.offset, offset);
	}
	setOffsetValues(x, y) {
		vec3.set(
			this.offset,
			isNaN(x) ? 0.0 : x,
			isNaN(y) ? 0.0 : y,
			0
		);
	}
}