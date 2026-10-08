import { PNG } from "pngjs";

export interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface PixelReader {
  width: number;
  height: number;
  /** Return the pixel at (x, y). */
  at(x: number, y: number): Pixel;
  /** Count pixels matching the predicate. */
  count(pred: (px: Pixel) => boolean): number;
  /** Raw PNG data (used by matchImageSnapshot). */
  _png: PNG;
}

export async function pixelReaderfromDataURL(
  data: Blob | ArrayBuffer,
): Promise<PixelReader> {
  const buf =
    data instanceof ArrayBuffer
      ? Buffer.from(data)
      : Buffer.from(await data.arrayBuffer());
  const png = PNG.sync.read(buf);
  const pixelAt = (i: number): Pixel => ({
    r: png.data[i] ?? 0,
    g: png.data[i + 1] ?? 0,
    b: png.data[i + 2] ?? 0,
    a: png.data[i + 3] ?? 0,
  });
  return {
    width: png.width,
    height: png.height,
    _png: png,
    at(x, y) {
      if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
        throw new RangeError(`Pixel (${x}, ${y}) is outside the image`);
      }
      return pixelAt((png.width * y + x) * 4);
    },
    count(pred) {
      let n = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        if (pred(pixelAt(i))) n++;
      }
      return n;
    },
  };
}

export const isWhite = (px: Pixel): boolean =>
  px.r > 200 && px.g > 200 && px.b > 200 && px.a > 200;

export const isDark = (px: Pixel): boolean =>
  px.r < 50 && px.g < 50 && px.b < 50 && px.a > 200;
