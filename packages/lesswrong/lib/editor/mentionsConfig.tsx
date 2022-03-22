import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from "../algoliaUtil";
import {promisify} from "../utils/asyncUtils";
import ReactDOM from 'react-dom';
import React from 'react'

interface SearchHit {
  title: string,
  slug: string,
}

interface SearchResults {
  hits: SearchHit[]
}

const postMarker = '#';

const initSearchForIndex = (indexName: AlgoliaIndexCollectionName) => {
  const searchClient = getSearchClient()
  const index = searchClient.initIndex(getAlgoliaIndexName(indexName))
  const search = (...args) => index.search(...args)
  return promisify(search)
}

async function fetchSuggestions(searchString: string) {
  const search = initSearchForIndex('Posts')
  const searchResults = await search({
    query: searchString,
    attributesToRetrieve: ['title', 'slug'],
    hitsPerPage: 20
  }) as SearchResults
  console.log({searchResults})
  return searchResults.hits.map(it => postMarker + it.title)
}


const mentionHitRenderer = (item) => {
  const itemElement = document.createElement('span')
  ReactDOM.render(<p>TTTTT</p>, itemElement)
  return itemElement
} 

export const mentionPluginConfiguration = {
    feeds: [
      {
        marker: postMarker,
        feed: fetchSuggestions,
        itemRenderer: mentionHitRenderer,
        minimumCharacters: 1
      }
    ]
  }
