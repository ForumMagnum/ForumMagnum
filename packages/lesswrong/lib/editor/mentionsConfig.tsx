import {AlgoliaIndexCollectionName, getAlgoliaIndexName, getSearchClient} from '../algoliaUtil'
import {promisify} from '../utils/asyncUtils'
import {getSiteUrl} from '../vulcan-lib'

interface PostSearchHit {
  title: string,
  slug: string,
  _id: string
}

interface PostSearchResults {
  hits: PostSearchHit[]
}

interface UserSearchHit {
  name: string,
  slug: string,
  _id: string
}

interface UserSearchResults {
  hits: PostSearchHit[]
}

const postMarker = '#';
const userMarker = '@';
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
    hitsPerPage: 20
  }) as PostSearchResults
  
  return searchResults.hits.map(hit => {
    return {
      id: postMarker + hit.title, //what gets displayed in the dropdown results, must have postMarker 
      link: `${linkPrefix}posts/${hit._id}/${hit.slug}`,
      text: hit.title,
    }
  })
}

async function fetchUserSuggestions(searchString: string) {
  const search = initSearchForIndex('Users')
  const searchResults = await search({
    query: searchString,
    attributesToRetrieve: ['displayName', 'slug', '_id'],
    hitsPerPage: 20
  }) as UserSearchResults
  
  return searchResults.hits.map(hit => {
    return {
      id: userMarker + hit.displayName, //what gets displayed in the dropdown results, must have postMarker 
      link: `${linkPrefix}users/${hit.slug}`,
      text: hit.displayName,
    }
  })
}

export const mentionPluginConfiguration = {
  feeds: [
    {
      marker: postMarker,
      feed: fetchPostSuggestions,
      minimumCharacters: 1
    },
    {
      marker: userMarker,
      feed: fetchUserSuggestions,
      minimumCharacters: 1
    }
  ]
}
