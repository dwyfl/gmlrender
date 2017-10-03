import {mat3, vec3} from 'gl-matrix';
import Environment from './base';

const DEFAULT_CLIENT_BOUNDS = vec3.fromValues(1024, 768, 0);
const DEFAULT_CLIENT_ENVS = {
	'Graffiti Analysis 2.0: DustTag': { screenBounds: { x: 480, y: 320 }, up: { x: 1, y: 0, z: 0 } },
	'DustTag: Graffiti Analysis 2.0': { screenBounds: { x: 480, y: 320 }, up: { x: 1, y: 0, z: 0 } },
	'Fat Tag - Katsu Edition':        { screenBounds: { x: 480, y: 320 }, up: { x: 1, y: 0, z: 0 } }
};

export default class TagEnvironment extends Environment {
	constructor(tag, clientScreenBounds) {
		super();
		this.tag = tag;
		this.tagEnvironment = this._getEnvironmentFromTag(tag);
		this.setScreenBoundsValues(
			this.tagEnvironment.screenBounds.x,
			this.tagEnvironment.screenBounds.y
		);
		this.clientScreenBounds = typeof(clientScreenBounds) !== 'undefined'
			? clientScreenBounds
			: DEFAULT_CLIENT_BOUNDS;
		this.setOffset(this._getOffsetFromEnvironment(this.tagEnvironment));
		this.setTransform(this._getTransformFromEnvironment(this.tagEnvironment));
	}
	setClientScreenBounds(bounds) {
		vec3.copy(this.clientScreenBounds, bounds);
	}
	setClientScreenBoundsValues(width, height) {
		vec3.set(this.clientScreenBounds, width, height, 0);
	}
	_getEnvironmentFromTag(tag) {
		let env = {
			screenBounds: { x: this.screenBounds[0], y: this.screenBounds[1] }
		};
		let clientEnv = tag.getEnvironment();
		if (clientEnv === null) {
			// Hard code environment for certain clients.
			const client = tag.getChildPath(['header', 'client', 'name']);
			for (let clientName in DEFAULT_CLIENT_ENVS) {
				if (client === clientName) {
					clientEnv = DEFAULT_CLIENT_ENVS[clientName];
				}
			}
		}
		if (clientEnv) {
			for (let i in clientEnv) {
				env[i] = clientEnv[i];
			}
		}
		return env;
	}
	_getTransformFromEnvironment(env) {
		let m = mat3.create();
		if (!env) {
			return m;
		}
		if (env.up) {
			let upTransform = this._getUpTransformFromEnvironment(env);
			mat3.multiply(m, m, upTransform);
		}
		if (env.rotation) {
			// This property is very vaguely specified in the spec.
			// Ignore it for now.
		}
		let boundsTransform = this._getScreenBoundsTransform(
			this.screenBounds,
			this.clientScreenBounds
		);
		mat3.multiply(m, m, boundsTransform);
		return m;
	}
	_getUpTransformFromEnvironment(env) {
		let m = mat3.create();
		if (!env.up) {
			return m;
		}
		// Some GML documents have (0,0,0) as up vector
		if (Math.abs(env.up.x) + Math.abs(env.up.y) + Math.abs(env.up.z) === 0) {
			return m;
		}
		// We use (0,-1,0) as up vector.
		// Find angle between this and up vector and create rotation matrix.
		let a = vec3.fromValues(env.up.x, env.up.y, env.up.z);
		let b = vec3.fromValues(0, -1, 0);
		let r = this._getRotationMatrixToAlignVectors(a, b);
		mat3.copy(m, r);
		mat3.str(m);
		return m;
	}
	_getRotationMatrixToAlignVectors(a, b) {
		// Z coordinate is currently ignored.
		const m = mat3.create();
		const alen = vec3.length(a);
		if (alen > 1.0)
			vec3.scale(a, a, 1/alen);
		const blen = vec3.length(b);
		if (blen > 1.0)
			vec3.scale(b, b, 1/blen);
		const abdot = vec3.dot(a, b);
		if (abdot === 1 || abdot === -1 || alen === 0 || blen === 0)
			return m;
		let v = vec3.create();
		vec3.cross(v, a, b);
		// Skew-symmetric cross-product matrix of v
		const s = vec3.length(v);
		const f = s !== 0 ? (1 - abdot) / (s * s) : 0;
		let vx2 = mat3.create();
		let vx = mat3.fromValues(
			    0, -v[2],  v[1],
			 v[2],     0, -v[0],
			-v[1],  v[0],     0
		);
		mat3.multiply(vx2, vx, vx);
		mat3.multiplyScalar(vx2, vx2, f);
		mat3.add(m, m, vx);
		mat3.add(m, m, vx2);
		return m;
	}
	_getOffsetFromEnvironment(env) {
		if (!env.offset) {
			return vec3.create();
		}
		// Offset is in screen space coordinates.
		var v = vec3.create();
		var k = [
			parseFloat(env.offset.x),
			parseFloat(env.offset.y),
			parseFloat(env.offset.z)
		];
		if (!isNaN(k[0]) && !isNaN(k[1]) && !isNaN(k[2])) {
			vec3.copy(v, k);
		}
		return v;
	}
	_getScreenBoundsTransform(tagScreenBounds, clientScreenBounds) {
		// Scale to fit original screenBounds into client context.
		let m = mat3.create();
		var boundsWidth = parseFloat(this.screenBounds[0]);
		var boundsHeight = parseFloat(this.screenBounds[1]);
		if (isNaN(boundsWidth) || boundsWidth <= 0)
			boundsWidth = clientScreenBounds[0];
		if (isNaN(boundsHeight) || boundsHeight <= 0)
			boundsHeight = clientScreenBounds[1];
		var dx = boundsWidth / clientScreenBounds[0];
		var dy = boundsHeight / clientScreenBounds[1];
		if (dx > 1 || dy > 1) {
			var s = 0.95 / Math.max(dy, dx);
			dx *= s;
			dy *= s;
		} else if (dx < 1 && dy < 1) {
			var s = 0.95 / Math.max(dy, dx);
			dx *= s;
			dy *= s;
		} else {
			dx = dy = 0.95;
		}
		return mat3.fromScaling(m, [dx, dy]);
	}
}