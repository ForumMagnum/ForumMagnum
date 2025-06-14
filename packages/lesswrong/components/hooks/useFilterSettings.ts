import { useTracking } from '@/lib/analyticsEvents';
import { useQuery } from '@/lib/crud/useQuery';
import { getDefaultFilterSettings, FilterSettings, addSuggestedTagsToSettings, FilterMode, filterModeIsSubscribed } from '@/lib/filterSettings';
import { findIndex, filter } from 'lodash';
import { useState, useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from './useUpdateCurrentUser';
import { gql } from '@/lib/generated/gql-codegen';

export const TagBasicInfoMultiQuery = gql(`
  query multiTagfilterSettingsQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagBasicInfo
      }
      totalCount
    }
  }
`);

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
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { captureEvent } = useTracking();

  const defaultSettings = currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings();
  let [filterSettings, setFilterSettingsLocally] = useState<FilterSettings>(defaultSettings);

  const { data, error: errorLoadingSuggestedTags, loading: loadingSuggestedTags } = useQuery(TagBasicInfoMultiQuery, {
    variables: {
      selector: { suggestedFilterTags: {} },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const suggestedTags = data?.tags?.results;

  if (suggestedTags) {
    filterSettings = addSuggestedTagsToSettings(filterSettings, suggestedTags);
  }

  /** Set the whole mess */
  const setFilterSettings = useCallback((newSettings: FilterSettings) => {
    setFilterSettingsLocally(newSettings);
    void updateCurrentUser({
      frontpageFilterSettings: newSettings,
    });
  }, [updateCurrentUser]);

  const setPersonalBlogFilter = useCallback((mode: FilterMode) => {
    setFilterSettings({
      personalBlog: mode,
      tags: filterSettings.tags,
    });
  }, [setFilterSettings, filterSettings]);

  /** Upsert - tagName required for insert */
  const setTagFilter = useCallback(({ tagId, tagName, filterMode }: { tagId: string; tagName?: string; filterMode: FilterMode; }) => {
    // update
    let existingTagFilter = filterSettings.tags.find(tag => tag.tagId === tagId);
    if (existingTagFilter) {
      const replacedIndex = findIndex(filterSettings.tags, t => t.tagId === tagId);
      let newTagFilters = [...filterSettings.tags];
      newTagFilters[replacedIndex] = {
        ...filterSettings.tags[replacedIndex],
        filterMode,
      };
      setFilterSettings({
        personalBlog: filterSettings.personalBlog,
        tags: newTagFilters,
      });
      captureEvent('tagFilterModified', { tagId, tagName, newMode: filterMode });
      return;
    }
    // insert
    if (!tagName) {
      throw new Error("tagName required for insert");
    }
    captureEvent("tagAddedToFilters", { tagId, tagName });
    setFilterSettings({
      personalBlog: filterSettings.personalBlog,
      tags: [...filterSettings.tags, { tagId, tagName, filterMode }],
    });
  }, [setFilterSettings, filterSettings, captureEvent]);

  const removeTagFilter = useCallback((tagId: string) => {
    if (suggestedTags && suggestedTags.find(tag => tag._id === tagId)) {
      throw new Error("Can't remove suggested tag");
    }
    captureEvent("tagRemovedFromFilters", { tagId });
    const newTags = filter(filterSettings.tags, tag => tag.tagId !== tagId);
    setFilterSettings({
      personalBlog: filterSettings.personalBlog,
      tags: newTags,
    });
  }, [setFilterSettings, filterSettings, suggestedTags, captureEvent]);

  return {
    filterSettings,
    loadingSuggestedTags,
    errorLoadingSuggestedTags,
    setFilterSettings,
    setPersonalBlogFilter,
    removeTagFilter,
    setTagFilter,
  };
};

/**
 * A simple wrapper on top of useFilterSettings focused on a single tag
 * subscription
 */
export const useSubscribeUserToTag = (tag?: Pick<TagBasicInfo, "_id" | "name">) => {
  const { filterSettings, setTagFilter } = useFilterSettings();

  const tagFilterSetting = filterSettings.tags.find(ft => tag && ft.tagId === tag._id);
  const isSubscribed = !!(tagFilterSetting && (filterModeIsSubscribed(tagFilterSetting.filterMode)));

  const subscribeUserToTag = useCallback((tag: Pick<TagBasicInfo, "_id" | "name">, filterMode: FilterMode) => {
    setTagFilter({
      tagId: tag._id,
      tagName: tag.name,
      filterMode: filterMode,
    });
  }, [setTagFilter]);

  return { isSubscribed, subscribeUserToTag };
};
