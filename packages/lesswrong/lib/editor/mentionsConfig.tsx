import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from '../search/algoliaUtil'
import {promisify} from '../utils/asyncUtils'
import {Components, getSiteUrl} from '../vulcan-lib'
import React from 'react'
import ReactDOM from 'react-dom'
import {userGetDisplayName} from '../collections/users/helpers'
import {userMentionQueryString} from '../pingback'


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

const initSearchForIndex = (indexName: AlgoliaIndexCollectionName) => {
  const searchClient = getSearchClient()
  const index = searchClient.initIndex(getAlgoliaIndexName(indexName))
  return promisify(index.search.bind(index));
}

async function fetchPostSuggestions(searchString: string) {
  const search = initSearchForIndex('Posts')
  const searchResults = await search({
    query: searchString,
    attributesToRetrieve: ['title', 'slug', '_id'],
    hitsPerPage: 20,
  }) as { hits: PostSearchHit[] }

  return searchResults.hits.map(hit => ({
    id: markers.post + hit.title, //what gets displayed in the dropdown results, must have postMarker 
    link: `${linkPrefix}posts/${hit._id}/${hit.slug}`,
    text: hit.title,
  }))
}

async function fetchUserSuggestions(searchString: string) {
  const search = initSearchForIndex('Users')
  const searchResults = await search({
    query: searchString,
    attributesToRetrieve: ['displayName', 'slug', '_id', 'username', 'groups', 'karma', 'createdAt', 'fullName'],
    hitsPerPage: 20,
  }) as { hits: UserSearchHit[] }

  return searchResults.hits.map(hit => {
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
