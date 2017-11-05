import DefaultRenderProps from './index';

export default class BackgroundRenderProps extends DefaultRenderProps {
  constructor(color = '#fff') {
    super();
    this.fillStyle = color;
  }
}