import GML_TIME from './time';

const GML_WINDOW = ((win) => {
  // Check for vendor specific requestAnimationFrame
  const vendors = ['ms', 'moz', 'webkit', 'o'];
  for (let x = 0; x < vendors.length && !win.requestAnimationFrame; ++x) {
    const vendor = vendors[x];
    win.requestAnimationFrame = win[vendor + 'RequestAnimationFrame'];
    win.cancelAnimationFrame =
      win[vendor + 'CancelAnimationFrame'] ||
      win[vendor + 'CancelRequestAnimationFrame'];
  }
  // Window.requestAnimationFrame() polyfill
  let lastTime = 0;
  if (!win.requestAnimationFrame) {
    win.requestAnimationFrame = (callback) => {
      const currTime = GML_TIME();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      lastTime = currTime + timeToCall;
      return win.setTimeout(() => callback(currTime + timeToCall), timeToCall);
    };
  }
  // Window.cancelAnimationFrame() polyfill
  if (!win.cancelAnimationFrame) {
    win.cancelAnimationFrame = (id) => win.clearTimeout(id);
  }
  return win;
})(typeof(window) === 'undefined' ? {} : window);

export default GML_WINDOW;