import type { Client } from "algoliasearch/lite";
import NativeSearchClient from "./NativeSearchClient";
import { algoliaAppIdSetting, algoliaSearchKeySetting, algoliaPrefixSetting } from '../publicSettings';
import { isEAForum } from "../instanceSettings";
import { isAnyTest } from "../executionEnvironment";

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

export const isAlgoliaEnabled = () => !!algoliaAppIdSetting.get() && !!algoliaSearchKeySetting.get() && !isAnyTest && !isEAForum

// TODO: Hide search-UI if neither Elastic nor Algolia is configured
export const isSearchEnabled = () => true;

let searchClient: Client | null = null;

const getNativeSearchClient = (): Client | null => {
  if (!searchClient) {
    searchClient = new NativeSearchClient();
  }
  return searchClient;
}

export const getSearchClient = (): Client => {
  const client = getNativeSearchClient();
  if (!client) {
    throw new Error("Couldn't initialize search client");
  }
  return client
}
