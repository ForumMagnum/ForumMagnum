import type { ForumTypeString } from '@/lib/instanceSettings';
import { defaultVisibilityTags } from './instanceSettings';

export interface FilterSettings {
  personalBlog: FilterMode,
  tags: Array<FilterTag>,
}
export interface FilterTag {
  tagId: string,
  tagName: string,
  filterMode: FilterMode,
}

/** TagDefault relies on there being a FilterMode on the tag */
export const FILTER_MODE_CHOICES = [
  'Hidden', 'Default', 'Required', 'Subscribed', 'Reduced'
] as const;

export type FilterMode = (typeof FILTER_MODE_CHOICES)[number] | "TagDefault" | number | `x${number}`;

export const getStandardFilterModes = (): FilterMode[] => {
  return [...FILTER_MODE_CHOICES, 0, 0.5, 25];
}

export const isCustomFilterMode = (mode: string|number) =>
  !getStandardFilterModes().includes(mode as FilterMode);

export const getDefaultFilterSettings = (forumType: ForumTypeString): FilterSettings => {
  return {
    personalBlog: "Hidden",
    // Default visibility tags are always set with "TagDefault" until the user
    // changes them. But the filter mode in default visibility tags is used as
    // that default. That way, if it gets updated, we don't need to run a
    // migration to update the users.
    tags: defaultVisibilityTags.get(forumType).map(tf => ({...tf, filterMode: "TagDefault"})),
  }
}

export const filterModeIsSubscribed = (filterMode: FilterMode) =>
  filterMode === "Subscribed" || (typeof filterMode==='number' && filterMode >= 25)

export interface ClassifiedTagFilters {
  required: FilterTag[],
  hidden: FilterTag[],
  softFiltered: FilterTag[],
}

const resolveTagDefault = (tag: FilterTag, forumType: ForumTypeString): FilterTag => {
  if (tag.filterMode !== "TagDefault") {
    return tag;
  }
  const defaultTag = defaultVisibilityTags.get(forumType).find(dft => dft.tagId === tag.tagId);
  return { ...tag, filterMode: defaultTag?.filterMode || "Default" };
}

export const classifyTagFilters = (tags: FilterTag[], forumType: ForumTypeString): ClassifiedTagFilters => {
  const resolvedTags = tags.map(tag => resolveTagDefault(tag, forumType));
  return {
    required: resolvedTags.filter(t => t.filterMode === "Required"),
    hidden: resolvedTags.filter(t => t.filterMode === "Hidden"),
    softFiltered: resolvedTags.filter(t =>
      t.filterMode !== "Hidden" && t.filterMode !== "Required" && t.filterMode !== "Default" && t.filterMode !== 0
    ),
  };
}

export function filterModeToAdditiveKarmaModifier(mode: FilterMode): number {
  if (typeof mode === "number" && (mode <= 0 || 1 <= mode)) {
    return mode;
  } else switch(mode) {
    default:
    case "Default": return 0;
    case "Subscribed": return 25;
  }
}

export function filterModeToMultiplicativeKarmaModifier(mode: FilterMode): number {
  // Example: "x10.0" is a multiplier of 10
  const match = typeof mode === "string" && mode.match(/^x(\d+(?:\.\d+)?)$/);
  if (match) {
    return parseFloat(match[1]);
  } else if (typeof mode === "number" && 0 < mode && mode < 1) {
    return mode;
  } else {
    switch(mode) {
      default:
      case "Default": return 1;
      case "Reduced": return 0.5;
    }
  }
}
