const noop = () => {};
const GML_DOCUMENT = (() => {
  return document === undefined
    ? {
      getElementById: noop,
      createElement: noop,
    }
    : document;
})();

export default GML_DOCUMENT;