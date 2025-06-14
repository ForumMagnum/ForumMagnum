import { defaultVisibilityTags } from './publicSettings';
import filter from 'lodash/filter';

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

export const getDefaultFilterSettings = (): FilterSettings => {
  return {
    personalBlog: "Hidden",
    // Default visibility tags are always set with "TagDefault" until the user
    // changes them. But the filter mode in default visibility tags is used as
    // that default. That way, if it gets updated, we don't need to run a
    // migration to update the users.
    tags: defaultVisibilityTags.get().map(tf => ({...tf, filterMode: "TagDefault"})),
  }
}

export const addSuggestedTagsToSettings = (existingFilterSettings: FilterSettings, suggestedTags: Array<TagBasicInfo>): FilterSettings => {
  const tagsIncluded: Record<string,boolean> = {};
  for (let tag of existingFilterSettings.tags)
    tagsIncluded[tag.tagId] = true;
  const tagsNotIncluded = filter(suggestedTags, tag=>!(tag._id in tagsIncluded));

  return {
    ...existingFilterSettings,
    tags: [
      ...existingFilterSettings.tags,
      ...tagsNotIncluded.map((tag: TagPreviewFragment): FilterTag => ({
        tagId: tag._id,
        tagName: tag.name,
        filterMode: "Default",
      })),
    ],
  };
}

export const filterModeIsSubscribed = (filterMode: FilterMode) =>
  filterMode === "Subscribed" || (typeof filterMode==='number' && filterMode >= 25)
