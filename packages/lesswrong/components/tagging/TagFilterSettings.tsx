import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { FilterSettings, FilterTag, FilterMode } from '../../lib/filterSettings';
import { useMulti } from '../../lib/crud/withMulti';
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft: "auto",
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingBottom: 4
  },
  addButton: {
    backgroundColor: theme.palette.grey[300],
    paddingLeft: 9,
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 9,
    borderRadius: 3,
    fontWeight: 700,
    marginBottom: 4,
    cursor: "pointer"
  }
});

const lwafPersonalBlogpostInfo = {
  name: "Personal Blog",
  tooltip: <div>
    <p><b>Personal Blogposts</b> are posts that don't fit LessWrong's Frontpage Guidelines. They get less visibility by default. The frontpage guidelines are:</p>
    <ul>
      <li><em>Timelessness</em>. Will people still care about this in 5 years?</li>
      <li><em>Avoid political topics</em>. They're important to discuss sometimes, but we try to avoid it on LessWrong.</li>
      <li><em>General Appeal</em>. Is this a niche post that only a small fraction of users will care about?</li>
    </ul>
  </div>
}

const personalBlogpostInfo = {
  LessWrong: lwafPersonalBlogpostInfo,
  AlignmentForum: lwafPersonalBlogpostInfo,
  EAForum: {
    name: 'Personal',
    tooltip: <div>
      <div>
        By default, the home page only displays Frontpage Posts, which are selected by moderators as especially interesting or useful to people with interest in doing good effectively. Personal posts get to have looser standards of relevance, and may include topics that could lead to more emotive or heated discussion (e.g. politics), which are generally excluded from Frontpage.
      </div>
    </div>
  }
}

const personalBlogpostName = personalBlogpostInfo[forumTypeSetting.get()].name
const personalBlogpostTooltip = personalBlogpostInfo[forumTypeSetting.get()].tooltip

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
  const { AddTagButton, FilterMode, Loading, LWTooltip } = Components
  const [addedSuggestedTags, setAddedSuggestedTags] = useState(false);
  
  const changeFilterSettings = (newSettings: FilterSettings): void => {
    setFilterSettings(newSettings);
    setAddedSuggestedTags(true);
  }

  const { results: suggestedTags, loading: loadingSuggestedTags } = useMulti({
    terms: {
      view: "suggestedFilterTags",
    },
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    limit: 100,
  });

  const { captureEvent } = useTracking()

  let filterSettingsWithSuggestedTags: FilterSettings = filterSettings;
  if (suggestedTags && !addedSuggestedTags) {
    filterSettingsWithSuggestedTags = addSuggestedTagsToSettings(filterSettings, suggestedTags);
  }

  return <span>
    {loadingSuggestedTags && !filterSettingsWithSuggestedTags.tags.length && <Loading/>}

    {filterSettingsWithSuggestedTags.tags.map(tagSettings =>
      <FilterMode
        label={tagSettings.tagName}
        key={tagSettings.tagId}
        tagId={tagSettings.tagId}
        mode={tagSettings.filterMode}
        canRemove={true}
        onChangeMode={(mode: FilterMode) => {
          const newMode = mode === tagSettings.filterMode ? 0 : mode
          const changedTagId = tagSettings.tagId;
          const replacedIndex = _.findIndex(filterSettingsWithSuggestedTags.tags, t=>t.tagId===changedTagId);
          let newTagFilters = [...filterSettingsWithSuggestedTags.tags];
          newTagFilters[replacedIndex] = {
            ...filterSettingsWithSuggestedTags.tags[replacedIndex],
            filterMode: newMode
          };
          captureEvent('tagFilterModified', {tagId: tagSettings.tagId, tagName: tagSettings.tagName, newMode})

          changeFilterSettings({
            personalBlog: filterSettingsWithSuggestedTags.personalBlog,
            tags: newTagFilters,
          });
        }}
        onRemove={() => {
          changeFilterSettings({
            personalBlog: filterSettingsWithSuggestedTags.personalBlog,
            tags: _.filter(filterSettingsWithSuggestedTags.tags, t=>t.tagId !== tagSettings.tagId),
          });
          captureEvent("tagRemovedFromFilters", {tagId: tagSettings.tagId, tagName: tagSettings.tagName});
        }}
      />
    )}

    <FilterMode
      label={personalBlogpostName}
      description={personalBlogpostTooltip}
      mode={filterSettingsWithSuggestedTags.personalBlog}
      canRemove={false}
      onChangeMode={(mode: FilterMode) => {
        changeFilterSettings({
          personalBlog: mode,
          tags: filterSettingsWithSuggestedTags.tags,
        });
      }}
    />

    {<LWTooltip title="Add Tag Filter">
        <AddTagButton onTagSelected={({tagId,tagName}: {tagId: string, tagName: string}) => {
          if (!_.some(filterSettingsWithSuggestedTags.tags, t=>t.tagId===tagId)) {
            const newFilter: FilterTag = {tagId, tagName, filterMode: "Default"}
            changeFilterSettings({
              personalBlog: filterSettingsWithSuggestedTags.personalBlog,
              tags: [...filterSettingsWithSuggestedTags.tags, newFilter]
            });
            captureEvent("tagAddedToFilters", {tagId, tagName})
          }
        }}>
          <span className={classes.addButton}>+</span>
        </AddTagButton>
    </LWTooltip>}
  </span>
}

const addSuggestedTagsToSettings = (oldFilterSettings: FilterSettings, suggestedTags: Array<TagPreviewFragment>): FilterSettings => {
  const tagsIncluded: Record<string,boolean> = {};
  for (let tag of oldFilterSettings.tags)
    tagsIncluded[tag.tagId] = true;
  const tagsNotIncluded = _.filter(suggestedTags, tag=>!(tag._id in tagsIncluded));

  return {
    ...oldFilterSettings,
    tags: [
      ...oldFilterSettings.tags,
      ...tagsNotIncluded.map((tag: TagPreviewFragment): FilterTag => ({
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
