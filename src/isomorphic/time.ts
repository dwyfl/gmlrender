export const GML_time =
  typeof performance === "object" && typeof performance.now === "function"
    ? () => performance.now()
    : () => Date.now();

let timeLastFrame = 0;

export const GML_requestAnimationFrame: (callback: (time: number) => void) => number =
  typeof window === "undefined"
    ? (callback: (time: number) => void) => {
        const timeCurrent = GML_time();
        const timeToCallback = Math.max(0, 16 - (timeCurrent - timeLastFrame));
        timeLastFrame = timeCurrent + timeToCallback;
        const timeout = setTimeout(() => callback(timeCurrent + timeToCallback), timeToCallback);
        return timeout[Symbol.toPrimitive]();
      }
    : window.requestAnimationFrame.bind(window);

export const GML_cancelAnimationFrame: (handle: number) => void =
  typeof window === "undefined"
    ? (id: number) => clearTimeout(id)
    : window.cancelAnimationFrame.bind(window);

export const GML_setTimeout = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  ms: number = 0,
  ...args: Args
): number => {
  ms = Math.max(0, Math.min(ms, 2_147_483_647));
  const cb = (...args: Args) => callback(...args);
  const timer = setTimeout(cb, ms, ...args);
  return +timer;
};

export const GML_clearTimeout = clearTimeout;
