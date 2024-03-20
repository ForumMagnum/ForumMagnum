import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSearchClient } from "../../lib/search/searchUtil";
import { MultiSelectResult, MultiSelectState, useMultiSelect } from "../hooks/useMultiSelect";
import { CAREER_STAGES } from "../../lib/collections/users/schema";
import { PeopleDirectoryColumn, peopleDirectoryColumns } from "./peopleDirectoryColumns";
import { SearchableMultiSelectResult, useSearchableMultiSelect } from "../hooks/useSearchableMultiSelect";

type PeopleDirectorySorting = {
  field: string,
  direction: "asc" | "desc",
}

type PeopleDirectoryContext = {
  query: string,
  setQuery: (query: string) => void,
  sorting: PeopleDirectorySorting | null,
  setSorting: (sorting: PeopleDirectorySorting | null) => void,
  results: SearchUser[],
  resultsLoading: boolean,
  roles: SearchableMultiSelectResult,
  organizations: SearchableMultiSelectResult,
  locations: SearchableMultiSelectResult,
  careerStages: MultiSelectResult,
  columns: (PeopleDirectoryColumn & MultiSelectState)[],
}

const peopleDirectoryContext = createContext<PeopleDirectoryContext | null>(null);

export const PeopleDirectoryProvider = ({children}: {children: ReactNode}) => {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<PeopleDirectorySorting | null>(null);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

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
    facetField: "location",
  });
  const careerStages = useMultiSelect({
    title: "Career stage",
    options: CAREER_STAGES,
  });

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

  useEffect(() => {
    setResultsLoading(true);
    const searchClient = getSearchClient();
    void (async () => {
      try {
        const sortString = sorting
          ? `_${sorting.field}:${sorting.direction}`
          : "";
        const facetFilters = [
          careerStages.selectedValues.map((stage) => `careerStage:${stage}`),
        ];
        const results = await searchClient.search([
          {
            indexName: "test_users" + sortString,
            query,
            params: {
              query,
              facetFilters,
            },
          },
        ]);
        setResults(results?.results?.[0]?.hits ?? []);
      } catch (e) {
        // TODO: Better error handling here
        // eslint-disable-next-line no-console
        console.error("Search error:", e);
      } finally {
        setResultsLoading(false);
      }
    })();
  }, [query, sorting, careerStages.selectedValues]);

  return (
    <peopleDirectoryContext.Provider value={{
      query,
      setQuery,
      sorting,
      setSorting,
      results,
      resultsLoading,
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
