import {vec3, mat3} from 'gl-matrix';
import {TagEnvironment} from '../environment';
import {RenderItemBackground, RenderItemDrips, RenderItemTags} from './renderitems';

export default class Renderer {
	constructor(gml, canvas, clientEnvironment) {
		this.gml = gml;
		this.canvas = canvas;
		this.clientEnvironment = clientEnvironment;
		this.tagEnvironments = this._createTagEnvironments(
			this.gml,
			this.clientEnvironment.getScreenBounds()
		);
		this.renderItems = this._createRenderItems(
			this.canvas,
			this.gml,
			this.clientEnvironment,
			this.tagEnvironments
		);
		this.disabledRenderItems = [];
	}
	_createRenderItems(canvas, gml, clientEnv, tagEnvs) {
		const result = [];
		result.push(new RenderItemBackground(canvas, gml, clientEnv, tagEnvs));
		result.push(new RenderItemTags(canvas, gml, clientEnv, tagEnvs));
		return result;
	}
	_createTagEnvironments(gml, clientScreenBounds) {
		const result = [];
		const tags = gml.getTags();
		if (tags && tags.length) {
			for (let tag of tags) {
				result.push(new TagEnvironment(tag, clientScreenBounds));
			}
		}
		return result;
	}
	disableRenderItem(index) {
		if (!this._renderItemIsDisabled(index)) {
			this.disabledRenderItems.push(index);
		}
	}
	enableRenderItem(index) {
		for (let i = 0; i < this.disabledRenderItems.length; ++i) {
			if (this.disabledRenderItems[i] === index) {
				this.disabledRenderItems.splice(i, 1);
			}
		}
	}
	_renderItemIsDisabled(index) {
		for (let i of this.disabledRenderItems) {
			if (i === index) {
				return true;
			}
		}
		return false;
	}
	unload() {
		this.canvas = null;
		this.gml = null;
		this.clientEnvironment = null;
		this.tagEnvironments = null;
		this.renderItems = null;
	}
	render(state) {
		this.canvas.clear();
		for (let i = 0; i < this.renderItems.length; ++i) {
			if (this._renderItemIsDisabled(i)) {
				continue;
			}
			this.renderItems[i].render(state);
		}
	}
}