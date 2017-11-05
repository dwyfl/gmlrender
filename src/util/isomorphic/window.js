import GML_TIME from './time';

const GML_WINDOW = (() => {
  if (!window) {
    throw new Error('No window global.');
  }
  // Check for vendor specific requestAnimationFrame
  const vendors = ['ms', 'moz', 'webkit', 'o'];
  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    const vendor = vendors[x];
    window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendor + 'CancelAnimationFrame'] ||
      window[vendor + 'CancelRequestAnimationFrame'];
  }
  // Window.requestAnimationFrame() polyfill
  let lastTime = 0;
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => {
      const currTime = GML_TIME();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      lastTime = currTime + timeToCall;
      return window.setTimeout(() => callback(currTime + timeToCall), timeToCall);
    };
  }
  // Window.cancelAnimationFrame() polyfill
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  }
  return window;
})();

export default GML_WINDOW;