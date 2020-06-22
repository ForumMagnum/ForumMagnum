import algoliasearch from "algoliasearch/lite";
import { algoliaAppIdSetting, algoliaSearchKeySetting, algoliaPrefixSetting } from './publicSettings';

const ALGOLIA_PREFIX = algoliaPrefixSetting.get()

export const algoliaIndexNames: Record<string,string> = {
  Comments: ALGOLIA_PREFIX+'comments',
  Posts: ALGOLIA_PREFIX+'posts',
  Users: ALGOLIA_PREFIX+'users',
  Sequences: ALGOLIA_PREFIX+'sequences',
  Tags: ALGOLIA_PREFIX+'tags',
};

export const isAlgoliaEnabled = !!algoliaAppIdSetting.get() && !!algoliaSearchKeySetting.get();

let searchClient: any = null;
export const getSearchClient = () => {
  const algoliaAppId = algoliaAppIdSetting.get()
  const algoliaSearchKey = algoliaSearchKeySetting.get()
  if (!algoliaAppId || !algoliaSearchKey)
    return null;
  if (!searchClient)
    searchClient = algoliasearch(algoliaAppId, algoliaSearchKey);
  return searchClient;
}
