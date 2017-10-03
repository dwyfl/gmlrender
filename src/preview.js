import GMLView from './view';

export default class Preview {
	constructor(gml, width, height){
		this.gml = gml;
		this.canvas = document.createElement('canvas');
		this.canvas.width = width;
		this.canvas.height = height;
		this.imageData = null;
	}
	getPreview(){
		if (!this.imageData) {
			this.imageData = this._render();
		}
		return this.imageData;
	}
	_render(){
		const gmlView = new GMLView(this.gml, this.canvas);
		gmlView.setProgress(1);
		gmlView._draw();
		const context = this.canvas.getContext("2d");
		context.globalCompositeOperation = "destination-over";
		context.fillStyle = "#fff";
		context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		return this.canvas.toDataURL("image/jpeg", 0.6);
	}
}