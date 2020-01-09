import { getSetting } from 'meteor/vulcan:core';
import algoliasearch from "algoliasearch/lite";

const ALGOLIA_PREFIX: string = getSetting("algolia.indexPrefix", "test_");
const algoliaAppId = getSetting('algolia.appId')
const algoliaSearchKey = getSetting('algolia.searchKey')

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
  if (!searchClient)
    searchClient = algoliasearch(algoliaAppId, algoliaSearchKey);
  return searchClient;
}
