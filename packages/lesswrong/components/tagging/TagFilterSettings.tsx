import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterSettings, FilterTag, FilterMode } from '../../lib/filterSettings';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';
import * as _ from 'underscore';

const styles = theme => ({
  root: {
    paddingLeft: 16,
    ...theme.typography.commentStyle,
  },
  tag: {
  },
  addTag: {
    marginTop: 8,
    marginBottom: 8,
  }
});


const personalBlogpostTooltip = <div>
  <div>
    By default, the home page only displays Frontpage Posts, which meet criteria including:
  </div>
  <ul>
    <li>Usefulness, novelty and relevance</li>
    <li>Timeless content (minimize reference to current events)</li>
    <li>Explain, rather than persuade</li>
  </ul>
  <div>
    Members can write about whatever they want on their personal blog. Personal blogposts are a good fit for:
  </div>
  <ul>
    <li>Niche topics, less relevant to most members</li>
    <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
    <li>Topics that are difficult to discuss rationally</li>
    <li>Personal ramblings</li>
  </ul>
  <div>
    All posts are submitted as personal blogposts. Moderators manually move some to frontpage
  </div>
</div>

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
  const { AddTagButton, FilterMode } = Components
  
  // ea-forum-look-here The name "Personal Blog Posts" is forum-specific terminology
  return <div className={classes.root}>
    <FilterMode
      description="Personal Blog Posts"
      helpTooltip={personalBlogpostTooltip}
      mode={filterSettings.personalBlog}
      canRemove={false}
      onChangeMode={(mode: FilterMode) => {
        setFilterSettings({
          personalBlog: mode,
          tags: filterSettings.tags,
        });
      }}
    />

    {filterSettings.tags.map(tagSettings =>
      <FilterMode
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
      <AddTagButton onTagSelected={({tagId,tagName}: {tagId: string, tagName: string}) => {
        if (!_.some(filterSettings.tags, t=>t.tagId===tagId)) {
          const newFilter: FilterTag = {tagId, tagName, filterMode: "Default"}
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

