import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from "../algoliaUtil";
import {promisify} from "../utils/asyncUtils";

interface SearchResults {
  hits: any
}

const initSearchForIndex = (indexName: AlgoliaIndexCollectionName) => {
  const searchClient = getSearchClient()
  const index = searchClient.initIndex(getAlgoliaIndexName(indexName))
  const search = (...args) => index.search(...args)
  return promisify(search)
}

async function fetchSuggestions(searchString: string) {
  const search = initSearchForIndex('Posts')
  console.log({search})
  
  const searchResults = await search(searchString) as SearchResults
  return searchResults.hits.map(it => '@'+ it.title)
}

export const mentionPluginConfiguration = {
    feeds: [
      {
        marker: '@',
        feed: fetchSuggestions,
        minimumCharacters: 1
      }
    ]
  }
