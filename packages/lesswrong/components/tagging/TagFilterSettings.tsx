import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterSettings, FilterTag, FilterMode } from '../../lib/filterSettings';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';
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

// Filter by Tag
//   Coronavirus
//     [None] [Less] [Neutral] [More] [Only]
//   Add Tag [_____]
const TagFilterSettings = ({ filterSettings, setFilterSettings, classes }: {
  filterSettings: FilterSettings
  setFilterSettings: (newSettings: FilterSettings)=>void,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const canFilterCustomTags = userCanManageTags(currentUser);
  
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
        key={tagSettings.tagId}
        mode={tagSettings.filterMode}
        canRemove={canFilterCustomTags}
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
    
    {canFilterCustomTags && <div className={classes.addTag}>
      <Components.AddTagButton onTagSelected={({tagId,tagName}: {tagId: string, tagName: string}) => {
        if (!_.some(filterSettings.tags, t=>t.tagId===tagId)) {
          const newFilter: FilterTag = {tagId, tagName, filterMode: "Neutral"}
          setFilterSettings({
            personalBlog: filterSettings.personalBlog,
            tags: [...filterSettings.tags, newFilter]
          });
        }
      }}/>
    </div>}
  </div>
}

const TagFilterSettingsComponent = registerComponent("TagFilterSettings", TagFilterSettings, {styles});

declare global {
  interface ComponentTypes {
    TagFilterSettings: typeof TagFilterSettingsComponent
  }
}

