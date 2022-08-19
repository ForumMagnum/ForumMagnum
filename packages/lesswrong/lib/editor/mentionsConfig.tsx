import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from '../algoliaUtil'
import {promisify} from '../utils/asyncUtils'
import {getSiteUrl} from '../vulcan-lib'

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
  
  return searchResults.hits.map(hit => {
    return {
      id: postMarker + hit.title, //what gets displayed in the dropdown results, must have postMarker 
      link: linkPrefix + 'posts/' + hit._id + '/' + hit.slug,
      text: hit.title,
    }
  })
}

export const mentionPluginConfiguration = {
    feeds: [
      {
        marker: postMarker,
        feed: fetchSuggestions,
        minimumCharacters: 1
      }
    ]
  }
