import { RenderItem } from "./base.ts";
import { RenderItemBackground } from "./background.ts";
import { RenderItemTags } from "./tags.ts";
import { RenderItemDrips as enderItemDrips } from "./drips.ts";

export { RenderItemBackground } from "./background.ts";
export { RenderItemDrips } from "./drips.ts";
export { RenderItemTags } from "./tags.ts";

export const RenderItemTypeMap = {
  base: RenderItem,
  background: RenderItemBackground,
  tags: RenderItemTags,
  drips: enderItemDrips,
} as const;

export type RenderItemTypeKey = keyof typeof RenderItemTypeMap;
export type RenderItemType<T extends RenderItemTypeKey> = (typeof RenderItemTypeMap)[T];
