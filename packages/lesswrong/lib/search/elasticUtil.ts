import { TupleSet, UnionOf } from "../utils/typeGuardUtils";
import { AlgoliaIndexCollectionName, getAlgoliaIndexName } from "./algoliaUtil";

export const elasticCollectionIsCustomSortable = (
  collectionName: AlgoliaIndexCollectionName,
): boolean => collectionName !== "Tags";

export const elasticSortings = new TupleSet([
  "relevance",
  "karma",
  "newest_first",
  "oldest_first",
] as const);

export type ElasticSorting = UnionOf<typeof elasticSortings>;

export const defaultElasticSorting: ElasticSorting = "relevance";

export const getElasticSortingsForCollection = (
  collectionName: AlgoliaIndexCollectionName,
): ElasticSorting[] => {
  const allSortings = Array.from(elasticSortings);
  if (collectionName === "Sequences") {
    return allSortings.filter((sorting) => sorting !== "karma");
  }
  return allSortings;
}

export const isValidElasticSorting = (sorting: string): sorting is ElasticSorting =>
  elasticSortings.has(sorting);

export const formatElasticSorting = (sorting: ElasticSorting): string =>
  sorting[0].toUpperCase() + sorting.slice(1).replace(/_/g, " ");

export const elasticSortingToUrlParam = (sorting: ElasticSorting): string|undefined =>
  sorting === defaultElasticSorting ? undefined : sorting;

export const getElasticIndexNameWithSorting = (
  collectionName: AlgoliaIndexCollectionName,
  sorting: ElasticSorting,
): string => {
  const baseIndex = getAlgoliaIndexName(collectionName);
  if (!elasticCollectionIsCustomSortable(collectionName)) {
    return baseIndex;
  }
  return sorting === defaultElasticSorting ? baseIndex : `${baseIndex}_${sorting}`;
}
