import * as _ from 'underscore';

export interface FilterSettings {
  personalBlog: FilterMode,
  tags: Array<FilterTag>,
}
export interface FilterTag {
  tagId: string,
  tagName: string,
  filterMode: FilterMode,
}
export type FilterMode = "Hide"|"Less"|"Neutral"|"More"|"Only"
//export const filterModes: Array<FilterMode> = ["Hide","Less","Neutral","More","Only"];
export const filterModes: Array<FilterMode> = ["Hide","Neutral","Only"];

export const defaultFilterSettings: FilterSettings = {
  personalBlog: "Hide",
  tags: [
    {
      tagId: "tNsqhzTibgGJKPEWB",
      tagName: "Coronavirus",
      filterMode: "Neutral",
    }
  ],
}

export function filterSettingsToString(filterSettings: FilterSettings): string {
  let nonNeutralTagModifiers = _.filter(filterSettings.tags,
    tag => tag.filterMode !== "Neutral");
  let hasTagModifiers = nonNeutralTagModifiers.length > 0;
  
  // Filters on a tag?
  if (hasTagModifiers) {
    // If filtering on more than one tag, give up and say "Custom"
    if (nonNeutralTagModifiers.length > 1)
      return "Custom";
    
    // Filters is for only the selected tag?
    const singleTagFilter = nonNeutralTagModifiers[0]
    if (singleTagFilter.filterMode === "Only") {
      if (filterSettings.personalBlog === "Neutral") {
        return singleTagFilter.tagName;
      } else if (filterSettings.personalBlog === "Hide") {
        return `Frontpage ${singleTagFilter.tagName}`
      } else {
        return "Custom";
      }
    } else if (singleTagFilter.filterMode === "Hide") {
      if (filterSettings.personalBlog === "Neutral") {
        return `No ${singleTagFilter.tagName}`;
      } else if (filterSettings.personalBlog === "Hide") {
        return `Frontpage, No ${singleTagFilter.tagName}`
      } else {
        return "Custom";
      }
    } else {
      // Filter modifies the amount of a tag. Just call it Custom.
      return "Custom";
    }
  }
  
  // Doesn't filter on a tag. Convert the personalBlog setting into a string.
  if (filterSettings.personalBlog === "Hide") {
    return "No Personal Blogposts";
  } else if (filterSettings.personalBlog === "Only") {
    return "Personal Blog";
  } else if (filterSettings.personalBlog === "Neutral") {
    return "All";
  } else {
    return "Custom";
  }
}
