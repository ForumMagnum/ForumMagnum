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

/**
 * Adding a new sorting is done by adding a new index in Algolia. In
 * general, you want to create a replica of an existing index rather
 * than an entire new index. To do this, add a new replica from the
 * "Replicas" tab of the existing index in Algolia (it should have
 * the same prefix and name as the existing index, with a suffix to
 * match the value in `algoliaReplicaSuffixes` below). Then edit the
 * new replica by going to "Configuration"->"Ranking and Sorting"
 * and click "Add sort-by attribute". Be sure to select the correct
 * sort direction on the new attribute as well.
 */
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

export const algoliaCollectionIsCustomSortable = (
  collectionName: AlgoliaIndexCollectionName,
): boolean => collectionName !== "Tags";

export const getAlgoliaIndexNameWithSorting = (
  collectionName: AlgoliaIndexCollectionName,
  sorting: AlgoliaSorting,
): string => {
  const baseIndex = getAlgoliaIndexName(collectionName);
  if (!algoliaCollectionIsCustomSortable(collectionName)) {
    return baseIndex;
  }
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
