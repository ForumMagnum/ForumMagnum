import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSearchClient } from "../../lib/search/searchUtil";
import { MultiSelectResult, MultiSelectState, useMultiSelect } from "../hooks/useMultiSelect";
import { CAREER_STAGES } from "../../lib/collections/users/schema";
import { PeopleDirectoryColumn, peopleDirectoryColumns } from "./peopleDirectoryColumns";
import { SearchableMultiSelectResult, useSearchableMultiSelect } from "../hooks/useSearchableMultiSelect";
import { useSearchAnalytics } from "../search/useSearchAnalytics";
import { captureException } from "@sentry/core";

type PeopleDirectorySorting = {
  field: string,
  direction: "asc" | "desc",
}

type PeopleDirectoryContext = {
  query: string,
  setQuery: (query: string) => void,
  clearSearch: () => void,
  isEmptySearch: boolean,
  sorting: PeopleDirectorySorting | null,
  setSorting: (sorting: PeopleDirectorySorting | null) => void,
  results: SearchUser[],
  resultsLoading: boolean,
  totalResults: number,
  loadMore: () => void,
  roles: SearchableMultiSelectResult,
  organizations: SearchableMultiSelectResult,
  locations: SearchableMultiSelectResult,
  careerStages: MultiSelectResult,
  columns: (PeopleDirectoryColumn & MultiSelectState)[],
}

const peopleDirectoryContext = createContext<PeopleDirectoryContext | null>(null);

export const PeopleDirectoryProvider = ({children}: {children: ReactNode}) => {
  const captureSearch = useSearchAnalytics();
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<PeopleDirectorySorting | null>(null);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(0);
  const [numPages, setNumPages] = useState(0);

  const roles = useSearchableMultiSelect({
    title: "Role",
    facetField: "jobTitle",
  });
  const organizations = useSearchableMultiSelect({
    title: "Organization",
    facetField: "organization",
  });
  const locations = useSearchableMultiSelect({
    title: "Location",
    facetField: "mapLocationAddress",
  });
  const careerStages = useMultiSelect({
    title: "Career stage",
    options: CAREER_STAGES,
  });

  const clearSearch = useCallback(() => {
    setQuery("");
    roles.clear();
    organizations.clear();
    locations.clear();
    careerStages.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles.clear, organizations.clear, locations.clear, careerStages.clear]);

  const isEmptySearch = query === "" &&
    roles.selectedValues.length === 0 &&
    organizations.selectedValues.length === 0 &&
    locations.selectedValues.length === 0 &&
    careerStages.selectedValues.length === 0;

  const [columns, setColumns] = useState(peopleDirectoryColumns);
  const toggleColumn = useCallback((columnLabel: string) => {
    setColumns((columns) => columns.map((column) => {
      return column.label === columnLabel && column.hideable
        ? {
          ...column,
          hidden: !column.hidden,
        }
        : column;
    }));
  }, []);
  const columnSelectState = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      value: column.label,
      label: column.label,
      selected: column.hideable && !column.hidden,
      onToggle: () => toggleColumn(column.label),
    }));
  }, [columns, toggleColumn]);

  const loadMore = useCallback(() => {
    const newPage = page + 1;
    if (!resultsLoading && newPage < numPages) {
      setPage(newPage);
    }
  }, [resultsLoading, page, numPages]);

  useEffect(() => {
    setResults([]);
    setTotalResults(0);
    setPage(0);
    setNumPages(0);
  }, [
    query,
    sorting,
    roles.selectedValues,
    organizations.selectedValues,
    locations.selectedValues,
    careerStages.selectedValues,
  ]);

  useEffect(() => {
    setResultsLoading(true);
    void (async () => {
      try {
        const sortString = sorting
          ? `_${sorting.field}:${sorting.direction}`
          : "";
        const facetFilters = [
          roles.selectedValues.map((role) => `jobTitle:${role}`),
          organizations.selectedValues.map((org) => `organization:${org}`),
          locations.selectedValues.map((location) => `mapLocationAddress:${location}`),
          careerStages.selectedValues.map((stage) => `careerStage:${stage}`),
        ];
        const response = await getSearchClient().search([
          {
            indexName: "test_users" + sortString,
            query,
            params: {
              query,
              facetFilters,
              page,
            },
          },
        ]);
        const results = response?.results?.[0];
        const hits = results?.hits ?? [];
        setResults((results) => results.concat(hits));
        setTotalResults(results?.nbHits ?? 0);
        setNumPages(results?.nbPages ?? 0);
        captureSearch("peopleDirectorySearch", {
          query,
          sorting,
          roles: roles.selectedValues,
          organizations: organizations.selectedValues,
          locations: locations.selectedValues,
          careerStages: careerStages.selectedValues,
          hitCount: hits.length,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("People directory search error:", e);
        captureException(e);
      } finally {
        setResultsLoading(false);
      }
    })();
  }, [
    captureSearch,
    page,
    query,
    sorting,
    roles.selectedValues,
    organizations.selectedValues,
    locations.selectedValues,
    careerStages.selectedValues,
  ]);

  return (
    <peopleDirectoryContext.Provider value={{
      query,
      setQuery,
      clearSearch,
      isEmptySearch,
      sorting,
      setSorting,
      results,
      resultsLoading,
      totalResults,
      loadMore,
      roles,
      organizations,
      locations,
      careerStages,
      columns: columnSelectState,
    }}>
      {children}
    </peopleDirectoryContext.Provider>
  );
}

export const usePeopleDirectory = (): PeopleDirectoryContext => {
  const context = useContext(peopleDirectoryContext);
  if (!context) {
    throw new Error("Using people directory context outside of a provider");
  }
  return context;
}
