import { useState } from 'react';
import { useCurrentUser } from '../components/common/withUser';
import { useUpdateCurrentUser } from '../components/hooks/useUpdateCurrentUser';
import { useMulti } from './crud/withMulti';
import { defaultVisibilityTags } from './publicSettings';
import filter from 'lodash/filter';
import findIndex from 'lodash/findIndex'
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
      const replacedIndex = findIndex(filterSettings.tags, t => t.tagId === tagId)
      let newTagFilters = [...filterSettings.tags]
      newTagFilters[replacedIndex] = {
        ...filterSettings.tags[replacedIndex],
        filterMode,
      }
      setFilterSettings({
        personalBlog: filterSettings.personalBlog,
        tags: newTagFilters,
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

export const useSubscribeUserToTag = (tag: TagBasicInfo) => {
  const { filterSettings, setTagFilter } = useFilterSettings()
  
  const filterSetting = filterSettings.tags.find(ft => ft.tagId === tag._id)
  const isSubscribed = filterSetting?.filterMode === "Subscribed" || filterSetting?.filterMode === 25
  
  function subscribeUserToTag(tag: TagBasicInfo, filterMode: FilterMode) {
    setTagFilter({
      tagId: tag._id,
      tagName: tag.name,
      filterMode: filterMode,
    })
  }
  
  return { isSubscribed, subscribeUserToTag }
}
