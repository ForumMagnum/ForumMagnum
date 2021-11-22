import { useState, useCallback } from 'react';
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

/**
 * Get the users frontpage tag filter settings, and methods to update them
 *
 * Notes on suggested tags: some tags in the database (none on the EA Forum,
 * some on LW), are marked as suggested. We need to query the database to figure
 * out which ones those are. We can still return the *users* filter settings, so
 * we do that while we wait for the database trip. Adjusting any tag settings
 * will result in the suggested tags getting save to the user object. This is
 * expected. The UI should prevent users from removing suggested tags.
 *
 * Default filter settings are like suggested tags, but they are
 * user-modifyable, and can come with default weights. They're only set up on
 * user-creation, though.
 *
 * A note on updates: we store a local copy of the filter settings, and
 * optimistically update that immediately, then send an update to the server,
 * which we don't wait for.
 */
export const useFilterSettings = () => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const { captureEvent } = useTracking()
  
  const defaultSettings = currentUser?.frontpageFilterSettings ?
    currentUser.frontpageFilterSettings :
    getDefaultFilterSettings()
  let [filterSettings, setFilterSettingsLocally] = useState<FilterSettings>(defaultSettings)
  
  const { results: suggestedTags, loading: loadingSuggestedTags, error: errorLoadingSuggestedTags } = useMulti({
    terms: {
      view: "suggestedFilterTags",
    },
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    limit: 100,
  })
  
  if (suggestedTags) {
    filterSettings = addSuggestedTagsToSettings(filterSettings, suggestedTags)
  }
  
  /** Set the whole mess */
  const setFilterSettings = useCallback((newSettings: FilterSettings) => {
    setFilterSettingsLocally(newSettings)
    void updateCurrentUser({
      frontpageFilterSettings: newSettings,
    })
  }, [updateCurrentUser])
  
  const setPersonalBlogFilter = useCallback((mode: FilterMode) => {
    setFilterSettings({
      personalBlog: mode,
      tags: filterSettings.tags,
    })
  }, [setFilterSettings, filterSettings])
  
  /** Upsert - tagName required for insert */
  const setTagFilter = useCallback(({tagId, tagName, filterMode}: {tagId: string, tagName?: string, filterMode: FilterMode}) => {
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
  }, [setFilterSettings, filterSettings, captureEvent])
  
  const removeTagFilter = useCallback((tagId: string) => {
    if (suggestedTags.find(tag => tag._id === tagId)) {
      throw new Error("Can't remove suggested tag")
    }
    captureEvent("tagRemovedFromFilters", {tagId});
    const newTags = filter(filterSettings.tags, tag => tag.tagId !== tagId)
    setFilterSettings({
      personalBlog: filterSettings.personalBlog,
      tags: newTags,
    })
  }, [setFilterSettings, filterSettings, suggestedTags, captureEvent])
  
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

/**
 * A simple wrapper on top of useFilterSettings focused on a single tag
 * subscription
 */
export const useSubscribeUserToTag = (tag: TagBasicInfo) => {
  const { filterSettings, setTagFilter } = useFilterSettings()
  
  const filterSetting = filterSettings.tags.find(ft => ft.tagId === tag._id)
  const isSubscribed = filterSetting?.filterMode === "Subscribed" || filterSetting?.filterMode === 25
  
  const subscribeUserToTag = useCallback((tag: TagBasicInfo, filterMode: FilterMode) => {
    setTagFilter({
      tagId: tag._id,
      tagName: tag.name,
      filterMode: filterMode,
    })
  }, [setTagFilter])
  
  return { isSubscribed, subscribeUserToTag }
}
