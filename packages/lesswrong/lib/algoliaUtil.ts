import { getSetting } from './vulcan-lib';
import algoliasearch from "algoliasearch/lite";

const ALGOLIA_PREFIX: string = getSetting("algolia.indexPrefix", "test_");
const algoliaAppId = getSetting<string|null>('algolia.appId')
const algoliaSearchKey = getSetting<string|null>('algolia.searchKey')

export const algoliaIndexNames: Record<string,string> = {
  Comments: ALGOLIA_PREFIX+'comments',
  Posts: ALGOLIA_PREFIX+'posts',
  Users: ALGOLIA_PREFIX+'users',
  Sequences: ALGOLIA_PREFIX+'sequences',
  Tags: ALGOLIA_PREFIX+'tags',
};

export const isAlgoliaEnabled = !!algoliaAppId && !!algoliaSearchKey;

let searchClient: any = null;
export const getSearchClient = () => {
  if (!algoliaAppId || !algoliaSearchKey)
    return null;
  if (!searchClient)
    searchClient = algoliasearch(algoliaAppId, algoliaSearchKey);
  return searchClient;
}
