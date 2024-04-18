import NativeSearchClient from "./NativeSearchClient";
import { TupleSet, UnionOf } from "../utils/typeGuardUtils";
import { algoliaPrefixSetting } from '../publicSettings';
import type { Client } from "algoliasearch/lite";
import {isElasticEnabled} from '../instanceSettings'
import { useEffect, useRef, useState } from "react";
import equals from "lodash/fp/equals";

export const searchIndexedCollectionNames = ["Comments", "Posts", "Users", "Sequences", "Tags", "Localgroups"] as const;
export type SearchIndexCollectionName = typeof searchIndexedCollectionNames[number];
export type SearchIndexedDbObject = DbComment | DbPost | DbUser | DbSequence | DbTag;
export interface SearchIndexedCollection extends CollectionBase<SearchIndexCollectionName> {}

export const getSearchIndexName = (collectionName: SearchIndexCollectionName): string => {
  const prefix = algoliaPrefixSetting.get()
  switch (collectionName) {
    case "Comments": return prefix + "comments";
    case "Posts": return prefix + "posts";
    case "Users": return prefix + "users";
    case "Sequences": return prefix + "sequences";
    case "Tags": return prefix + "tags";
    case "Localgroups": return prefix + "localgroups";
  }
}

export const elasticCollectionIsCustomSortable = (
  collectionName: SearchIndexCollectionName,
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
  collectionName: SearchIndexCollectionName,
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
  collectionName: SearchIndexCollectionName,
  sorting: ElasticSorting,
): string => {
  const baseIndex = getSearchIndexName(collectionName);
  if (!elasticCollectionIsCustomSortable(collectionName)) {
    return baseIndex;
  }
  return sorting === defaultElasticSorting ? baseIndex : `${baseIndex}_${sorting}`;
}

export const collectionIsSearchIndexed = (collectionName: CollectionNameString): collectionName is SearchIndexCollectionName => {
  // .includes is frustratingly typed to only accept variables with the type of
  // the array contents, and this plays badly with const arrays
  return (searchIndexedCollectionNames as unknown as string[]).includes(collectionName);
}

// TODO: Hide search-UI if neither Elastic nor Algolia is configured
export const isSearchEnabled = () => isElasticEnabled

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
  return client;
}

const useStableValue = <T>(value: T): T => {
  const memoizedValue = useRef(value);
  useEffect(() => {
    if (!equals(value, memoizedValue.current)) {
      memoizedValue.current = value;
    }
  }, [value]);
  return memoizedValue.current;
}

export const useSearch = <T>({indexName, query, facetFilters, page, hitsPerPage, skip}: {
  indexName: string,
  query: string,
  facetFilters?: string[],
  page?: number,
  hitsPerPage?: number
  skip?: boolean,
}) => {
  const [results, setResults] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const memoizedFacets = useStableValue(facetFilters);

  useEffect(() => {
    if (skip) {
      return;
    }
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const searchClient = getSearchClient();
        const response = await searchClient.search([
          {
            indexName,
            query,
            params: {
              query,
              facetFilters: memoizedFacets ? [memoizedFacets] : [],
              page,
              hitsPerPage,
            },
          },
        ]);
        setResults(response?.results?.[0]?.hits ?? null);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e);
      }
      setLoading(false);
    })();
  }, [query, indexName, memoizedFacets, page, hitsPerPage, skip]);

  return {results, loading, error};
}
