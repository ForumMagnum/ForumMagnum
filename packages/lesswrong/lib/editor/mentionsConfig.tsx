import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from '../algoliaUtil'
import {promisify} from '../utils/asyncUtils'
import {getSiteUrl, Components} from '../vulcan-lib'
import React from 'react'
import ReactDOM from 'react-dom'


interface PostSearchHit {
  title: string,
  slug: string,
  _id: string
}

interface UserSearchHit {
  displayName: string
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
  const search = (...args) => index.search(...args)
  return promisify(search)
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
    attributesToRetrieve: ['displayName', 'slug', '_id', 'username', 'groups', 'karma', 'createdAt'],
    hitsPerPage: 20,
  }) as { hits: UserSearchHit[] }

  return searchResults.hits.map(hit => ({
    id: markers.user + hit.displayName,
    // Query string is intended for later use in detecting the ping
    link: `${linkPrefix}users/${hit.slug}?mention=user`,
    text: hit.displayName,
    karma: hit.karma,
    createdAt: new Date(hit.createdAt),
  }))
}

const renderUserItem = (item: { text: string, karma?: number, createdAt: Date }) => {
  const itemElement = document.createElement('button')

  ReactDOM.render(<Components.UsersSearchAutocompleteHit {...item} displayName={item.text}/>, itemElement)

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
