import { mat3 } from '../vendor/gl-matrix';
import Environment from './base';

export default class ClientEnvironment extends Environment {
  constructor(width, height) {
    super();
    this.setScreenBoundsValues(width, height);
    this.rotation = 0; // Radians
    this.scale = 1;
  }
  setRotation(value){
    this.rotation = isNaN(value) ? 0.0 : value;
    this._updateTransform();
  }
  setScale(value){
    this.scale = isNaN(value) ? 1.0 : value;
    this._updateTransform();
  }
  _updateTransform(){
    if (this.rotation !== 0) {
      mat3.fromRotation(this.transform, this.rotation);
    }
    else {
      mat3.identity(this.transform);
    }
    if (this.scale !== 1) {	
      mat3.multiplyScalar(this.transform, this.transform, this.scale);
    }
  }
}