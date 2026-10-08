/**
 * Appearance options shared by createGMLImage, createGMLView, renderToVideo and
 * GMLView.setRenderOptions().
 */
export interface RenderOptions {
  /** Background color. */
  background: string;
  /** Stroke color of the tags and drips. */
  color: string;
  /** Multiplies every stroke's line width; brush widths from the GML document are kept. */
  brushSizeMultiplier: number;
  /** Show the (experimental) drip effect. */
  drips: boolean;
  /** Amount of drips, 0–1 (default 0.2). */
  dripFactor: number;
}
