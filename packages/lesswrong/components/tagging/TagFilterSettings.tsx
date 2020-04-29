import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterSettings, FilterTag, FilterMode } from '../../lib/filterSettings';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import * as _ from 'underscore';

const styles = theme => ({
  root: {
    marginLeft: "auto",
    marginBottom: 16,
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap"
  },
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

// Filter settings
// Appears in the gear-menu by latest posts, and in other places.
//
// filterSettings is the current configuration; setFilterSettings applies a
// change.
//
// When this is first opened, it pre-populates the set of tags with neutral
// filters of a core set of "suggested as filter" tags.
const TagFilterSettings = ({ filterSettings, setFilterSettings, classes }: {
  filterSettings: FilterSettings
  setFilterSettings: (newSettings: FilterSettings)=>void,
  classes: ClassesType,
}) => {
  const { AddTagButton, FilterMode, Loading } = Components
  const [addedSuggestedTags, setAddedSuggestedTags] = useState(false);
  
  const { results: suggestedTags, loading: loadingSuggestedTags } = useMulti({
    terms: {
      view: "suggestedFilterTags",
    },
    collection: Tags,
    fragmentName: "TagFragment",
    limit: 100,
  });
  
  if (suggestedTags && !addedSuggestedTags) {
    const filterSettingsWithSuggestedTags = addSuggestedTagsToSettings(filterSettings, suggestedTags);
    setAddedSuggestedTags(true);
    if (!_.isEqual(filterSettings, filterSettingsWithSuggestedTags))
      setFilterSettings(filterSettingsWithSuggestedTags);
  }
  
  // ea-forum-look-here The name "Personal Blog Posts" is forum-specific terminology
  return <div className={classes.root}>
    {filterSettings.tags.map(tagSettings =>
      <FilterMode
        label={tagSettings.tagName}
        key={tagSettings.tagId}
        tagId={tagSettings.tagId}
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
    <FilterMode
      label="Personal Blog"
      helpTooltip={personalBlogpostTooltip}
      mode={filterSettings.personalBlog}
      canRemove={false}
      description={<div>
        <p><b>Personal Blogposts</b> are posts that don't fit LessWrong's Frontpage Guidelines. They get less visibility by default. The frontpage guidelines are:</p>
        <ul>
          <li><em>Timelessness</em>. Will people still care about this in 5 years?</li>
          <li><em>Avoid political topics</em>. They're important to discuss sometimes, but we try to avoid it on LessWrong.</li>
          <li><em>General Appeal</em>. Is this a niche post that only a small fraction of users will care about?</li>
        </ul>
      </div>}
      onChangeMode={(mode: FilterMode) => {
        setFilterSettings({
          personalBlog: mode,
          tags: filterSettings.tags,
        });
      }}
    />
      
    {<AddTagButton onTagSelected={({tagId,tagName}: {tagId: string, tagName: string}) => {
        if (!_.some(filterSettings.tags, t=>t.tagId===tagId)) {
          const newFilter: FilterTag = {tagId, tagName, filterMode: "Default"}
          setFilterSettings({
            personalBlog: filterSettings.personalBlog,
            tags: [...filterSettings.tags, newFilter]
          });
        }
      }}/>}
    {loadingSuggestedTags && <Loading/>}
  </div>
}

const addSuggestedTagsToSettings = (oldFilterSettings: FilterSettings, suggestedTags: Array<TagFragment>): FilterSettings => {
  const tagsIncluded = {};
  for (let tag of oldFilterSettings.tags)
    tagsIncluded[tag.tagId] = true;
  const tagsNotIncluded = _.filter(suggestedTags, tag=>!(tag._id in tagsIncluded));
  
  return {
    ...oldFilterSettings,
    tags: [
      ...oldFilterSettings.tags,
      ...tagsNotIncluded.map(tag => ({
        tagId: tag._id,
        tagName: tag.name,
        filterMode: "Default",
      })),
    ],
  };
}

const TagFilterSettingsComponent = registerComponent("TagFilterSettings", TagFilterSettings, {styles});

declare global {
  interface ComponentTypes {
    TagFilterSettings: typeof TagFilterSettingsComponent
  }
}

