export const GML_time =
  typeof performance === "object" && typeof performance.now === "function"
    ? () => performance.now()
    : () => Date.now();

const FALLBACK_FRAME_MS = 16;

// Use the native requestAnimationFrame wherever it exists (windows and dedicated workers),
// otherwise fall back to timers (Node.js, Deno, shared/service workers).
// Timer handles are converted with unary plus: Node.js returns a Timeout object (with
// Symbol.toPrimitive), other runtimes return a number.
export const GML_requestAnimationFrame: (
  callback: (time: number) => void,
) => number =
  typeof globalThis.requestAnimationFrame === "function"
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (callback: (time: number) => void) =>
        +setTimeout(() => callback(GML_time()), FALLBACK_FRAME_MS);

export const GML_cancelAnimationFrame: (handle: number) => void =
  typeof globalThis.cancelAnimationFrame === "function"
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : (id: number) => clearTimeout(id);
