import {
  Canvas as NodeCanvas,
  CanvasRenderingContext2D as NodeCanvasRenderingContext2D,
  type CanvasFillRule as NodeCanvasFillRule,
  type CanvasGradient as NodeCanvasGradient,
  type CanvasPattern as NodeCanvasPattern,
  type CanvasLineCap as NodeCanvasLineCap,
  type CanvasLineJoin as NodeCanvasLineJoin,
  createCanvas as createNodeCanvas,
} from "canvas";

export type GMLCanvas = HTMLCanvasElement | NodeCanvas;
export interface GMLCanvasContext {
  beginPath: () => void;
  clearRect: (x: number, y: number, w: number, h: number) => void;
  closePath: () => void;
  fill: (fillRule?: NodeCanvasFillRule) => void;
  fillStyle: string | NodeCanvasGradient | NodeCanvasPattern;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  globalCompositeOperation: string;
  lineCap: NodeCanvasLineCap;
  lineJoin: NodeCanvasLineJoin;
  lineTo: (x: number, y: number) => void;
  lineWidth: number;
  moveTo: (x: number, y: number) => void;
  stroke: () => void;
  strokeStyle: string | NodeCanvasGradient | NodeCanvasPattern;
}

export function createCanvas(...args: [string] | [number, number]): GMLCanvas {
  if (typeof args[0] === "string") {
    return getCanvasById(args[0]);
  }
  if (args.length < 2 || typeof args[0] !== "number" || typeof args[1] !== "number") {
    throw new Error(`Bad canvas dimensions: ${args[0]}, ${args[1]}`);
  }
  if (typeof document === "undefined") {
    return createNodeCanvas(args[0], args[1]);
  }
  const [width, height] = args;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getCanvasContext(canvas: GMLCanvas): GMLCanvasContext | null {
  const context = canvas.getContext("2d");
  return (NodeCanvasRenderingContext2D != null &&
    context instanceof NodeCanvasRenderingContext2D) ||
    context instanceof CanvasRenderingContext2D
    ? context
    : null;
}

export function getCanvasById(id: string) {
  if (typeof document === "undefined") {
    throw new Error("getCanvasById is not available in this environment.");
  }
  const el = document.getElementById(id);
  if (!el || !(el instanceof HTMLCanvasElement)) {
    throw new Error(`No canvas found with id: ${id}`);
  }
  return el;
}
