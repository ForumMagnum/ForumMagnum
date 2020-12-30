import algoliasearch from "algoliasearch/lite";
import { algoliaAppIdSetting, algoliaSearchKeySetting, algoliaPrefixSetting } from './publicSettings';

export type AlgoliaIndexCollectionName = "Comments" | "Posts" | "Users" | "Sequences" | "Tags"

export const getAlgoliaIndexName = (collectionName: AlgoliaIndexCollectionName): string => {
  const ALGOLIA_PREFIX = algoliaPrefixSetting.get()
  
  switch (collectionName) {
    case "Comments": return ALGOLIA_PREFIX+'comments';
    case "Posts": return ALGOLIA_PREFIX+'posts';
    case "Users": return ALGOLIA_PREFIX+'users';
    case "Sequences": return ALGOLIA_PREFIX+'sequences';
    case "Tags": return ALGOLIA_PREFIX+'tags';
  }
}

export const getAlgoliaIndexedCollectionNames = (): Array<AlgoliaIndexCollectionName> => {
  return ["Comments", "Posts", "Users", "Sequences", "Tags"];
}

export const collectionIsAlgoliaIndexed = (collectionName: CollectionNameString): collectionName is AlgoliaIndexCollectionName => {
  return getAlgoliaIndexedCollectionNames().indexOf(collectionName as AlgoliaIndexCollectionName) >= 0;
}

export const isAlgoliaEnabled = () => !!algoliaAppIdSetting.get() && !!algoliaSearchKeySetting.get();

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
