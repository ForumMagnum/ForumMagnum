import {getSearchClient, getSearchIndexName, SearchIndexCollectionName} from '../search/searchUtil'
import {Components, getSiteUrl} from '../vulcan-lib'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {userGetDisplayName} from '../collections/users/helpers'
import {userMentionQueryString} from '../pingback'
import type {Response} from 'algoliasearch'
import {taggingNamePluralSetting} from '@/lib/instanceSettings'

const markers = {
  post: '@',
  user: '@',
  tag: '@',
}

const linkPrefix = getSiteUrl()

function initSearchForIndex<T>(collectionName: SearchIndexCollectionName) {
  const indexName = getSearchIndexName(collectionName)
  const searchClient = getSearchClient()

  return async (query: string): Promise<Response<T> | null> => {
    const response = await searchClient.search<T>([{
      indexName,
      query,
      params: {
        query,
        hitsPerPage: 6,
      },
    }])
    return response?.results?.[0]
  }
}

async function fetchPostSuggestions(searchString: string) {
  const search = initSearchForIndex<SearchPost>('Posts')
  const searchResults = await search(searchString)

  return searchResults?.hits.map(hit => ({
    type: 'Posts',
    id: markers.post + hit.title, //what gets displayed in the dropdown results, must have postMarker 
    link: `${linkPrefix}posts/${hit._id}/${hit.slug}`,
    text: hit.title,
    hit,
  })) || []
}

async function fetchUserSuggestions(searchString: string) {
  const search = initSearchForIndex<SearchUser>('Users')
  const searchResults = await search(searchString)

  return searchResults?.hits.map(hit => {
    const displayName = markers.user + userGetDisplayName(hit)
    return ({
      type: 'Users',
      id: displayName,
      // Query string is intended for later use in detecting the ping
      link: `${linkPrefix}users/${hit.slug}?${userMentionQueryString}`,
      text: displayName,
      hit: {
        ...hit,
        displayName: '👤 ' + userGetDisplayName(hit),
      },
    })
  }) || []
}

async function fetchTagSuggestions(searchString: string) {
  const search = initSearchForIndex<SearchTag>('Tags')
  const searchResults = await search(searchString)

  return searchResults?.hits.map(hit => ({
    type: 'Tags',
    id: markers.tag + hit.name,
    link: `${linkPrefix}${taggingNamePluralSetting.get()}/${hit.slug}`,
    text: hit.name,
    hit,
  })) || []
}

const fetchMentionableSuggestions = async (searchString: string) => [
  ...(await fetchUserSuggestions(searchString)),
  ...(await fetchTagSuggestions(searchString)),
  ...(await fetchPostSuggestions(searchString)),
]

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
