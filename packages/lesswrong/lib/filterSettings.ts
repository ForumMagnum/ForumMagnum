import { useState } from 'react';
import { useCurrentUser } from '../components/common/withUser';
import { useUpdateCurrentUser } from '../components/hooks/useUpdateCurrentUser';
import { useMulti } from './crud/withMulti';
import { defaultVisibilityTags } from './publicSettings';

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

// TODO; doc
export const useFilterSettings = () => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  
  const defaultSettings = currentUser?.frontpageFilterSettings ?
    currentUser.frontpageFilterSettings :
    getDefaultFilterSettings()
  const [filterSettings, setFilterSettingsLocally] = useState(defaultSettings)
  
  const { results: suggestedTags, loading: loadingSuggestedTags, error } = useMulti({
    terms: {
      view: "suggestedFilterTags",
    },
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    limit: 100,
  })
  
  if (error) return { filterSettings, loadingSuggestedTags, error }
  if (loadingSuggestedTags) return { filterSettings, loadingSuggestedTags, error }
  
  // TODO: something like a performance concern; Jim has `useMemo`'d this, maybe
  const filterSettingsWithSuggestedTags = addSuggestedTagsToSettings(filterSettings, suggestedTags)
  
  // TODO; useCallbacks
  /** Set the whole mess */
  function setFilterSettings(newSettings: FilterSettings) {
    setFilterSettingsLocally(newSettings)
    void updateCurrentUser({
      frontpageFilterSettings: newSettings,
    })
  }
  
  function setPersonalBlogFilter(mode: FilterMode) {
    setFilterSettings({})
  }
  
  function addTagFilter({ tagId, tagName, filterMode }: FilterTag) {
    setFilterSettings({})
  }
  
  function removeTagFilter(tagId: string) {
    setFilterSettings({})
  }
  
  function setTagFilter(tagId: string, mode: FilterMode) {
    setFilterSettings({})
  }
  
  return {
    filterSettings,
    filterSettingsWithSuggestedTags,
    loadingSuggestedTags: false,
    error: null,
    setFilterSettings,
    setPersonalBlogFilter,
    addTagFilter,
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
  const { addTagFilter } = useFilterSettings()
  
  function subscribeUserToTag(tag: TagBasicInfo) {
    addTagFilter({
      tagId: tag._id,
      tagName: tag.name,
      filterMode: "Subscribed",
    })
  }
  
  return subscribeUserToTag
}
//   const currentUser = useCurrentUser()
//   const updateUserFilterSettings = useUpdateUserFilterSettings()
//   const defaultSettings = currentUser?.frontpageFilterSettings ?
//     currentUser.frontpageFilterSettings :
//     getDefaultFilterSettings()
//   const updateCurrentUser = useUpdateCurrentUser()
//   if (!currentUser) return () => {}
  
//   let filterSettingsWithSuggestedTags: FilterSettings = filterSettings;
//   if (suggestedTags && !addedSuggestedTags) {
//     filterSettingsWithSuggestedTags = addSuggestedTagsToSettings(filterSettings, suggestedTags);
//   }
  
//   if (!_.some(filterSettingsWithSuggestedTags.tags, t=>t.tagId===tagId)) {
//     const defaultFilterMode = userHasNewTagSubscriptions(currentUser) ? 25 : "Default"
//     const newFilter: FilterTag = {tagId, tagName, filterMode: defaultFilterMode}
//     changeFilterSettings({
//       personalBlog: filterSettingsWithSuggestedTags.personalBlog,
//       tags: [...filterSettingsWithSuggestedTags.tags, newFilter]
//     });
//     captureEvent("tagAddedToFilters", {tagId, tagName})
//   }

//   // setFilterSettingsLocally(newSettings)
//   // void updateCurrentUser({
//   //   frontpageFilterSettings: newSettings,
//   // })
//   updateUserFilterSettings(user, {tagId: tag._id, tagName: tag.name, filterMode: "Subscribed"})
// }
