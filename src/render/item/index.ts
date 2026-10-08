import { RenderItemBackground } from "./background.ts";
import { RenderItemTags } from "./tags.ts";
import { RenderItemDrips } from "./drips.ts";

export { RenderItem } from "./base.ts";
export { RenderItemBackground } from "./background.ts";
export { RenderItemDrips, type DripOptions } from "./drips.ts";
export { RenderItemTags, type TagsOptions } from "./tags.ts";

/**
 * The render items every GMLView creates, keyed by their `type`.
 */
export const RenderItemTypeMap = {
  background: RenderItemBackground,
  tags: RenderItemTags,
  drips: RenderItemDrips,
} as const;

export type RenderItemTypeKey = keyof typeof RenderItemTypeMap;
export type RenderItemOfType<K extends RenderItemTypeKey> = InstanceType<
  (typeof RenderItemTypeMap)[K]
>;

export function isRenderItemTypeKey(type: string): type is RenderItemTypeKey {
  return Object.hasOwn(RenderItemTypeMap, type);
}
