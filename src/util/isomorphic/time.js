const GML_TIME = (() => {
  return typeof performance  === 'object' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();
})();

export default GML_TIME;