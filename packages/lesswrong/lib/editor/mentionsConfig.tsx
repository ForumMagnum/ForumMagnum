import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from "../algoliaUtil";
import {promisify} from "../utils/asyncUtils";
import ReactDOM from 'react-dom';
import React from 'react'
import {getSiteUrl} from "../vulcan-lib";

interface SearchHit {
  title: string,
  slug: string,
  _id: string
}

interface SearchResults {
  hits: SearchHit[]
}

const postMarker = '#';
const linkPrefix = getSiteUrl()

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
    attributesToRetrieve: ['title', 'slug', '_id'],
    hitsPerPage: 20
  }) as SearchResults
  console.log({searchResults})
  // return searchResults.hits.map(it => postMarker + it.title)
  // return searchResults.hits
  const convertedSearchResults = searchResults.hits.map(hit =>{
   return {
     id: postMarker+hit.title, //what gets displayed in the dropdown results, must have postMarker 
     link: linkPrefix + 'posts/' + hit._id + '/' + hit.slug, 
     text: hit.title, 
   }
  })
  console.log(convertedSearchResults)
  return convertedSearchResults
}


const mentionHitRenderer = (item) => { //TODO;
  const itemElement = document.createElement('span')
  ReactDOM.render(<p>${item.title}</p>, itemElement)
  return itemElement
} 

export const mentionPluginConfiguration = {
    feeds: [
      {
        marker: postMarker,
        feed: fetchSuggestions,
        // itemRenderer: mentionHitRenderer,
        minimumCharacters: 1
      }
    ]
  }
