import * as _ from 'underscore';
import { getSetting } from './vulcan-lib';

export interface FilterSettings {
  personalBlog: FilterMode,
  tags: Array<FilterTag>,
}
export interface FilterTag {
  tagId: string,
  tagName: string,
  filterMode: FilterMode,
}
export type FilterMode = "Hidden"|"Less"|"Included"|"More"|"Required"
//export const filterModes: Array<FilterMode> = ["Hidden","Less","Included","More","Required"];
export const filterModes: Array<FilterMode> = ["Hidden","Included","Required"];

export const defaultFilterSettings: FilterSettings = {
  personalBlog: "Hidden",
  tags: [
    {
      tagId: getSetting('coronavirusTagId'),
      tagName: "Coronavirus",
      filterMode: "Included",
    }
  ],
}

type FilterSummary = {[M in FilterMode]?: string}

export const filterTooltips: FilterSummary = {
  Hidden: "These posts will not appear on the home page",
  Included: "These posts will appear on the home page (sorted normally)",
  Required: "The home page will ONLY show posts that you have marked as 'required.'"
}

const lwafPersonalBlogpostFilterSummary: FilterSummary = {
  Hidden: "No Personal Blogposts",
  Included: "All",
  Required: "Personal Blog",
}

// LW and AF have different language than the EA Forum around the exclusion of
// their "special category" from the frontpage. The EA Forum excludes Community
// Posts, and needs langugage to support that. So we make a lookup for the text
// to use based on the forumType and FilterSetting.
const personalBlogpostFilterSummaries: {[forumType: string]: FilterSummary} = {
  LessWrong: lwafPersonalBlogpostFilterSummary,
  AlignmentForum: lwafPersonalBlogpostFilterSummary,
  EAForum: {
    Hidden: "No Community Posts",
    Included: "All",
    Required: "Community Posts Only",
  }
}

const forumPersonBlogpostFilterSummary: FilterSummary = personalBlogpostFilterSummaries[getSetting('forumType') as string]

export function filterSettingsToString(filterSettings: FilterSettings): string {
  let nonNeutralTagModifiers = _.filter(filterSettings.tags,
    tag => tag.filterMode !== "Included");
  let hasTagModifiers = nonNeutralTagModifiers.length > 0;
  
  // Filters on a tag?
  if (hasTagModifiers) {
    // If filtering on more than one tag, give up and say "Custom"
    if (nonNeutralTagModifiers.length > 1)
      return "Custom";
    
    // Filters is for only the selected tag?
    const singleTagFilter = nonNeutralTagModifiers[0]
    if (singleTagFilter.filterMode === "Required") {
      if (filterSettings.personalBlog === "Included") {
        return singleTagFilter.tagName;
      } else if (filterSettings.personalBlog === "Hidden") {
        return `Frontpage ${singleTagFilter.tagName}`
      } else {
        return "Custom";
      }
    } else if (singleTagFilter.filterMode === "Hidden") {
      if (filterSettings.personalBlog === "Included") {
        return `No ${singleTagFilter.tagName}`;
      } else if (filterSettings.personalBlog === "Hidden") {
        return `Frontpage, No ${singleTagFilter.tagName}`
      } else {
        return "Custom";
      }
    } else {
      // Filter modifies the amount of a tag. Just call it Custom.
      return "Custom";
    }
  }
  
  return forumPersonBlogpostFilterSummary[filterSettings.personalBlog] || "Custom"
}
