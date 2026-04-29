import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface MatchResult {
  mismatchedPixels: number;
  totalPixels: number;
  /** Fraction of pixels that differ (0–1). */
  mismatchPercent: number;
}

/**
 * Compare a rendered Blob against a reference PNG stored on disk.
 *
 * - If the reference file does not exist, it is created and `null` is returned
 *   (the test passes automatically on first run).
 * - If the reference exists, pixelmatch compares pixel-by-pixel and the result
 *   is returned for the caller to assert against.
 *
 * To regenerate a reference, delete the PNG file and re-run the tests.
 *
 * @param threshold  Per-pixel color tolerance passed to pixelmatch (0–1).
 *                   0.1 absorbs minor antialiasing differences.
 */
export async function matchImageSnapshot(
  data: Blob | ArrayBuffer,
  snapshotPath: string,
  { threshold = 0.1 }: { threshold?: number } = {},
): Promise<MatchResult | null> {
  const buf =
    data instanceof ArrayBuffer ? Buffer.from(data) : Buffer.from(await data.arrayBuffer());
  const rendered = PNG.sync.read(buf);

  if (!existsSync(snapshotPath)) {
    mkdirSync(dirname(snapshotPath), { recursive: true });
    writeFileSync(snapshotPath, PNG.sync.write(rendered));
    return null; // first run — reference created, nothing to compare yet
  }

  const reference = PNG.sync.read(readFileSync(snapshotPath));

  if (rendered.width !== reference.width || rendered.height !== reference.height) {
    throw new Error(
      `Image dimensions differ: rendered ${rendered.width}×${rendered.height}, ` +
        `reference ${reference.width}×${reference.height}. ` +
        `Delete the reference file to regenerate it.`,
    );
  }

  const { width, height } = reference;
  const diff = new PNG({ width, height });
  const mismatchedPixels = pixelmatch(reference.data, rendered.data, diff.data, width, height, {
    threshold,
  });

  return {
    mismatchedPixels,
    totalPixels: width * height,
    mismatchPercent: mismatchedPixels / (width * height),
  };
}
