import { getSearchClient } from '../search/searchUtil'
import {Components, getSiteUrl} from '../vulcan-lib'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {userGetDisplayName} from '../collections/users/helpers'
import {userMentionQueryString} from '../pingback'
import {taggingNamePluralSetting} from '@/lib/instanceSettings'
import { filterNonnull } from '../utils/typeGuardUtils'

const markers = {
  post: '@',
  user: '@',
  tag: '@',
}

const linkPrefix = getSiteUrl()

const formatSearchHit = (hit: SearchUser | SearchPost | SearchTag) => {
  switch (hit._index) {
    case "users":
      const displayName = markers.user + userGetDisplayName(hit);
      return {
        type: "Users",
        id: displayName,
        // Query string is intended for later use in detecting the ping
        link: `${linkPrefix}users/${hit.slug}?${userMentionQueryString}`,
        text: displayName,
        hit: {
          ...hit,
          displayName: "👤 " + userGetDisplayName(hit),
        },
      };
    case "posts":
      return {
        type: "Posts",
        // What gets displayed in the dropdown results, must have postMarker
        id: markers.post + hit.title,
        link: `${linkPrefix}posts/${hit._id}/${hit.slug}`,
        text: hit.title,
        hit,
      };
    case "tags":
      return {
        type: "Tags",
        id: markers.tag + hit.name,
        link: `${linkPrefix}${taggingNamePluralSetting.get()}/${hit.slug}`,
        text: hit.name,
        hit,
      };
    default:
      return null;
  }
}

const fetchMentionableSuggestions = async (searchString: string) => {
  const searchClient = getSearchClient();
  const response = await searchClient.search<SearchUser | SearchPost | SearchTag>([{
    indexName: "posts,users,tags",
    query: searchString,
    params: {
      query: searchString,
      hitsPerPage: 6,
    },
  }])
  const hits = response?.results?.[0]?.hits;
  return Array.isArray(hits) ? filterNonnull(hits.map(formatSearchHit)) : [];
}

interface MentionItem {
  type: 'Users' | 'Posts' | 'Tags'
  id: string
  text: string
  link: string
  hit: SearchUser | SearchPost | SearchTag
}

const renderUserItem = (item: MentionItem) => {
  const itemElement = document.createElement('button')
  itemElement.classList.add('ck-mention-item', 'ck-reset_all-excluded')
  const root = createRoot(itemElement)

  root.render(<Components.UsersSearchAutocompleteHit hit={item.hit as SearchUser}/>)

  return itemElement
}

const renderMentionItem = (
  item: MentionItem,
) => {
  const renderer = {
    Users: renderUserItem,
    Posts: (item: MentionItem) => '📃 ' + item.text,
    Tags: (item: MentionItem) => '🏷️ ' + item.text,
  }[item.type]

  return renderer(item)
}

export const mentionPluginConfiguration = {
  feeds: [
    {
      marker: '@',
      feed: fetchMentionableSuggestions,
      minimumCharacters: 1,
      itemRenderer: renderMentionItem,
    },
  ],
}
