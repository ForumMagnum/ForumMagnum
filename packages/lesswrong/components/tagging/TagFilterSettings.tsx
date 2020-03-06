import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import * as _ from 'underscore';

const styles = theme => ({
  root: {
    paddingLeft: 32,
    ...theme.typography.commentStyle,
  },
  tag: {
  },
  addTag: {
  },
});

interface FilterSettings {
  personalBlog: FilterMode,
  tags: Array<FilterTag>,
}
interface FilterTag {
  tagId: string,
  tagName: string,
  filterMode: FilterMode,
}
export type FilterMode = "Hide"|"Less"|"Neutral"|"More"|"Only"
export const filterModes: Array<FilterMode> = ["Hide","Less","Neutral","More","Only"];

export const defaultFilterSettings: FilterSettings = {
  personalBlog: "Hide",
  tags: [],
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
      }
    } else {
      // Filter excludes or modifies the amount of a tag. Just call it Custom.
      return "Custom";
    }
  }
  
  // Doesn't filter on a tag. Convert the personalBlog setting into a string.
  if (filterSettings.personalBlog === "Hide") {
    return "Frontpage";
  } else if (filterSettings.personalBlog === "Only") {
    return "Personal Blog";
  } else if (filterSettings.personalBlog === "Neutral") {
    return "All";
  } else {
    return "Custom";
  }
}

// Filter by Tag
//   Coronavirus
//     [None] [Less] [Neutral] [More] [Only]
//   Add Tag [_____]
const TagFilterSettings = ({ filterSettings, setFilterSettings, classes }: {
  filterSettings: FilterSettings
  setFilterSettings: (newSettings: FilterSettings)=>void,
  classes: ClassesType,
}) => {
  // ea-forum-look-here The name "Personal Blog Posts" is forum-specific terminology
  return <div className={classes.root}>
    <div className={classes.filterMode}>
      <Components.FilterMode
        description="Personal Blog Posts"
        mode={filterSettings.personalBlog}
        canRemove={false}
        onChangeMode={(mode: FilterMode) => {
          setFilterSettings({
            personalBlog: mode,
            tags: filterSettings.tags,
          });
        }}
      />
    </div>
    {filterSettings.tags.map(tagSettings =>
      <Components.FilterMode
        description={tagSettings.tagName}
        mode={tagSettings.filterMode}
        canRemove={true}
        onChangeMode={(mode: FilterMode) => {
          const changedTagId = tagSettings.tagId;
          const replacedIndex = _.findIndex(filterSettings.tags, t=>t.tagId===changedTagId);
          let newTagFilters = [...filterSettings.tags];
          newTagFilters[replacedIndex] = {
            ...filterSettings.tags[replacedIndex],
            filterMode: mode
          };
          
          setFilterSettings({
            personalBlog: filterSettings.personalBlog,
            tags: newTagFilters,
          });
        }}
        onRemove={() => {
          setFilterSettings({
            personalBlog: filterSettings.personalBlog,
            tags: _.filter(filterSettings.tags, t=>t.tagId !== tagSettings.tagId),
          });
        }}
      />
    )}
    
    <div className={classes.addTag}>
      <Components.AddTagButton onTagSelected={({tagId,tagName}: {tagId: string, tagName: string}) => {
        if (!_.some(filterSettings.tags, t=>t.tagId===tagId)) {
          const newFilter: FilterTag = {tagId, tagName, filterMode: "Neutral"}
          setFilterSettings({
            personalBlog: filterSettings.personalBlog,
            tags: [...filterSettings.tags, newFilter]
          });
        }
      }}/>
    </div>
  </div>
}

const TagFilterSettingsComponent = registerComponent("TagFilterSettings", TagFilterSettings, {styles});

declare global {
  interface ComponentTypes {
    TagFilterSettings: typeof TagFilterSettingsComponent
  }
}

