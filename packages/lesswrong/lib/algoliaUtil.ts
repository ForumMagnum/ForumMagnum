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
 * than an entire new index. This can be done by updating the config
 * in algoliaConfigureIndexes.ts.
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

class SortReplica {
  constructor(
    private name?: string,
    private direction?: "asc" | "desc",
  ) {}

  getIndexName(baseIndex: string): string {
    let suffix = "";
    if (this.name) {
      suffix += `_${this.name}`;
    }
    if (this.direction) {
      suffix += `_${this.direction}`;
    }
    return baseIndex + suffix;
  }

  private getRankingFields(): string[] {
    switch (this.name) {
    case "date":
      return ["publicDateMs", "createdAt"];
    default:
      throw new Error(`Can't convert sort name '${this.name}' to ranking field`);
    }
  }

  getRanking(): string[] {
    return this.getRankingFields().map((field) => `${this.direction}(${field})`);
  }
}

const algoliaReplicas: Record<AlgoliaSorting, SortReplica> = {
  relevance: new SortReplica(),
  newest_first: new SortReplica("date", "desc"),
  oldest_first: new SortReplica("date", "asc"),
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
  return algoliaReplicas[sorting].getIndexName(baseIndex);
}

export const getAlgoliaReplicasForCollection = (
  collectionName: AlgoliaIndexCollectionName,
): {indexName: string, rankings: string[]}[] => {
  if (!algoliaCollectionIsCustomSortable(collectionName)) {
    return [];
  }

  const result: ReturnType<typeof getAlgoliaReplicasForCollection> = [];
  for (const sorting of algoliaSortings) {
    if (sorting !== defaultAlgoliaSorting) {
      result.push({
        indexName: getAlgoliaIndexNameWithSorting(collectionName, sorting),
        rankings: algoliaReplicas[sorting].getRanking(),
      });
    }
  }
  return result;
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
