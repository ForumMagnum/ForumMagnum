import { useState } from 'react';
import { useCurrentUser } from '../components/common/withUser';
import { useUpdateCurrentUser } from '../components/hooks/useUpdateCurrentUser';
import { useMulti } from './crud/withMulti';
import { defaultVisibilityTags } from './publicSettings';
import filter from 'lodash/filter';
import { useTracking } from './analyticsEvents';

export interface FilterSettings {
  personalBlog: FilterMode,
  tags: Array<FilterTag>,
}
export interface FilterTag {
  tagId: string,
  tagName: string,
  filterMode: FilterMode,
}
export type FilterMode = "Hidden"|"Default"|"Required"|"Subscribed"|"Reduced"|number

export const getDefaultFilterSettings = (): FilterSettings => ({
  personalBlog: "Hidden",
  tags: defaultVisibilityTags.get(),
})

const addSuggestedTagsToSettings = (oldFilterSettings: FilterSettings, suggestedTags: Array<TagPreviewFragment>): FilterSettings => {
  const tagsIncluded: Record<string,boolean> = {};
  for (let tag of oldFilterSettings.tags)
    tagsIncluded[tag.tagId] = true;
  const tagsNotIncluded = filter(suggestedTags, tag=>!(tag._id in tagsIncluded));

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

// TODO; doc
export const useFilterSettings = () => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const { captureEvent } = useTracking()
  
  const defaultSettings = currentUser?.frontpageFilterSettings ?
    currentUser.frontpageFilterSettings :
    getDefaultFilterSettings()
  console.log('🚀 ~ file: filterSettings.ts ~ line 49 ~ useFilterSettings ~ defaultSettings', defaultSettings)
  let [filterSettings, setFilterSettingsLocally] = useState<FilterSettings>(defaultSettings)
  
  const { results: suggestedTags, loading: loadingSuggestedTags, error: errorLoadingSuggestedTags } = useMulti({
    terms: {
      view: "suggestedFilterTags",
    },
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    limit: 100,
  })
  
  // TODO; something like a performance concern; Jim has `useMemo`'d this, maybe
  if (suggestedTags) {
    filterSettings = addSuggestedTagsToSettings(filterSettings, suggestedTags)
  }
  
  // TODO; useCallbacks
  /** Set the whole mess */
  function setFilterSettings(newSettings: FilterSettings) {
    setFilterSettingsLocally(newSettings)
    void updateCurrentUser({
      frontpageFilterSettings: newSettings,
    })
  }
  
  function setPersonalBlogFilter(mode: FilterMode) {
    setFilterSettings({
      personalBlog: mode,
      tags: filterSettings.tags,
    })
  }
  
  /** Upsert - tagName required for insert */
  function setTagFilter({tagId, tagName, filterMode}: {tagId: string, tagName?: string, filterMode: FilterMode}) {
    // update
    let existingTagFilter = filterSettings.tags.find(tag => tag.tagId === tagId)
    if (existingTagFilter) {
      // !mutation!
      // (Mutation is useful here to maintain the order of the tags)
      existingTagFilter.filterMode = filterMode
      console.log('existingTagFilter.filterMode', existingTagFilter.filterMode) // unchanged
      setFilterSettings({
        personalBlog: filterSettings.personalBlog,
        tags: filterSettings.tags,
      })
      captureEvent('tagFilterModified', {tagId, tagName, newMode: filterMode})
      return
    }
    // insert
    if (!tagName) {
      throw new Error("tagName required for insert")
    }
    captureEvent("tagAddedToFilters", {tagId, tagName})
    setFilterSettings({
      personalBlog: filterSettings.personalBlog,
      tags: [...filterSettings.tags, { tagId, tagName, filterMode }],
    })
  }
  
  function removeTagFilter(tagId: string) {
    if (suggestedTags.find(tag => tag._id === tagId)) {
      throw new Error("Can't remove suggested tag")
    }
    captureEvent("tagRemovedFromFilters", {tagId});
    const newTags = filter(filterSettings.tags, tag => tag.tagId !== tagId)
    setFilterSettings({
      personalBlog: filterSettings.personalBlog,
      tags: newTags,
    })
  }
  
  return {
    filterSettings,
    loadingSuggestedTags,
    errorLoadingSuggestedTags,
    setFilterSettings,
    setPersonalBlogFilter,
    removeTagFilter,
    setTagFilter,
  }
}

export const userIsSubscribedToTag = (user: UsersCurrent|null, tagId: string) => {
  if (!user) return false
  // Currently typed as any, but will be FilterSettings
  const filterSetting = (user.frontpageFilterSettings as FilterSettings).tags
    .find(ft => ft.tagId === tagId)
  return filterSetting?.filterMode === "Subscribed" || filterSetting?.filterMode === 25
}

export const useSubscribeUserToTag = () => {
  const { setTagFilter } = useFilterSettings()
  
  function subscribeUserToTag(tag: TagBasicInfo) {
    // TODO;
    setTagFilter({
      tagId: tag._id,
      tagName: tag.name,
      filterMode: "Subscribed",
    })
  }
  
  return subscribeUserToTag
}
