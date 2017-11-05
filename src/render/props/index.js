class RenderProps {
  constructor() {
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.lineWidth = 0;
    this.lineCap = 'round';
    this.lineJoin = 'round';
  }
  toObject() {
    return {
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
    };
  }
}

export default RenderProps;
export { RenderProps as DefaultRenderProps };