import algoliasearch from "algoliasearch/lite";
import { algoliaAppIdSetting, algoliaSearchKeySetting, algoliaPrefixSetting } from './publicSettings';

export const algoliaIndexedCollectionNames = ["Comments", "Posts", "Users", "Sequences", "Tags"] as const
export type AlgoliaIndexCollectionName = typeof algoliaIndexedCollectionNames[number]

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

export const collectionIsAlgoliaIndexed = (collectionName: CollectionNameString): collectionName is AlgoliaIndexCollectionName => {
  // .includes is frustratingly typed to only accept variables with the type of
  // the array contents, and this plays badly with const arrays
  return (algoliaIndexedCollectionNames as unknown as string[]).includes(collectionName)
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
