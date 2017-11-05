import DefaultRenderProps from './index';

export default class ForegroundRenderProps extends DefaultRenderProps {
  constructor(color = '#000') {
    super();
    this.fillStyle = color;
  }
}