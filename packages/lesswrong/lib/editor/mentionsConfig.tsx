import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from '../search/algoliaUtil'
import {Components, getSiteUrl} from '../vulcan-lib'
import React from 'react'
import ReactDOM from 'react-dom'
import {userGetDisplayName} from '../collections/users/helpers'
import {userMentionQueryString} from '../pingback'
import type { Response } from 'algoliasearch'

interface PostSearchHit {
  title: string,
  slug: string,
  _id: string
}

interface UserSearchHit {
  displayName: string
  fullName?: string
  slug: string
  _id: string
  username: string
  groups?: string[]
  karma?: number
  createdAt: string
}

const markers = {
  post: '#',
  user: '@',
}

const linkPrefix = getSiteUrl()

function initSearchForIndex<T>(collectionName: AlgoliaIndexCollectionName) {
  const indexName = getAlgoliaIndexName(collectionName);
  const searchClient = getSearchClient();
  return async (
    query: string,
    attributesToRetrieve: string[],
  ): Promise<Response<T> | null> => {
    const response = await searchClient.search<T>([{
      indexName,
      query,
      params: {
        query,
        attributesToRetrieve,
        hitsPerPage: 20,
      },
    }]);
    return response?.results?.[0];
  };
}

async function fetchPostSuggestions(searchString: string) {
  const search = initSearchForIndex<PostSearchHit>('Posts')
  const searchResults = await search(searchString, ['title', 'slug', '_id']);

  return searchResults?.hits.map(hit => ({
    id: markers.post + hit.title, //what gets displayed in the dropdown results, must have postMarker 
    link: `${linkPrefix}posts/${hit._id}/${hit.slug}`,
    text: hit.title,
  }))
}

async function fetchUserSuggestions(searchString: string) {
  const search = initSearchForIndex<UserSearchHit>('Users')
  const searchResults = await search(searchString, ['displayName', 'slug', '_id', 'username', 'groups', 'karma', 'createdAt', 'fullName']);

  return searchResults?.hits.map(hit => {
    const displayName = markers.user + userGetDisplayName(hit)
    return ({
      id: displayName,
      // Query string is intended for later use in detecting the ping
      link: `${linkPrefix}users/${hit.slug}?${userMentionQueryString}`,
      text: displayName,
      karma: hit.karma,
      createdAt: new Date(hit.createdAt),
    })
  })
}

const renderUserItem = (item: { text: string, karma?: number, createdAt: Date }) => {
  const itemElement = document.createElement('button')

  ReactDOM.render(<Components.UsersSearchAutocompleteHit {...item} name={item.text}/>, itemElement)

  return itemElement
}

export const mentionPluginConfiguration = {
  feeds: [
    {
      marker: markers.post,
      feed: fetchPostSuggestions,
      minimumCharacters: 1,
    },
    {
      marker: markers.user,
      feed: fetchUserSuggestions,
      minimumCharacters: 1,
      itemRenderer: renderUserItem,
    },
  ],
}
