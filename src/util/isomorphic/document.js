import Canvas from 'canvas-prebuilt';

const noop = () => {};
const GML_DOCUMENT = (() => {
  return typeof document  === 'object'
    ? document
    : {
      getElementById: noop,
      createElement: (nodeName) => nodeName === 'canvas' ? new Canvas() : null,
    };
})();

export default GML_DOCUMENT;