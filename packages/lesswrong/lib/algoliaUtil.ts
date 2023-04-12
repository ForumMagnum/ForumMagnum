import algoliasearch from "algoliasearch/lite";
import { algoliaAppIdSetting, algoliaSearchKeySetting, algoliaPrefixSetting } from './publicSettings';
import { TupleSet, UnionOf } from "./utils/typeGuardUtils";

export const algoliaIndexedCollectionNames = new TupleSet([
  "Comments",
  "Posts",
  "Users",
  "Sequences",
  "Tags",
] as const);

export type AlgoliaIndexCollectionName = UnionOf<typeof algoliaIndexedCollectionNames>;

export const collectionIsAlgoliaIndexed = (
  collectionName: CollectionNameString,
): collectionName is AlgoliaIndexCollectionName =>
  algoliaIndexedCollectionNames.has(collectionName);

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

export const algoliaSortings = new TupleSet([
  "relevance",
  "newest_first",
  "oldest_first",
] as const);

export type AlgoliaSorting = UnionOf<typeof algoliaSortings>;

export const defaultAlgoliaSorting: AlgoliaSorting = "relevance";

export const isValidAlgoliaSorting = (sorting: string): sorting is AlgoliaSorting =>
  algoliaSortings.has(sorting);

export const algoliaReplicaSuffixes: Record<AlgoliaSorting, string> = {
  relevance: "",
  newest_first: "_date_desc",
  oldest_first: "_date_asc",
};

export const getAlgoliaIndexNameWithSorting = (
  collectionName: AlgoliaIndexCollectionName,
  sorting: AlgoliaSorting,
): string => {
  const baseIndex = getAlgoliaIndexName(collectionName);
  return baseIndex + algoliaReplicaSuffixes[sorting];
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
