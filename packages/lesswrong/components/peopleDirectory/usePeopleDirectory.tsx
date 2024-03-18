import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { getSearchClient } from "../../lib/search/searchUtil";
import { MultiSelectResult, useMultiSelect } from "../hooks/useMultiSelect";
import { CAREER_STAGES } from "../../lib/collections/users/schema";

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
  careerStages: MultiSelectResult,
}

const peopleDirectoryContext = createContext<PeopleDirectoryContext | null>(null);

export const PeopleDirectoryProvider = ({children}: {children: ReactNode}) => {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<PeopleDirectorySorting | null>(null);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const careerStages = useMultiSelect({
    title: "Career stage",
    options: CAREER_STAGES,
  });

  const selectedCareerStages = careerStages.selectedValues;

  useEffect(() => {
    setResultsLoading(true);
    const searchClient = getSearchClient();
    void (async () => {
      try {
        const sortString = sorting
          ? `_${sorting.field}:${sorting.direction}`
          : "";
        const facetFilters = [
          selectedCareerStages.map((stage) => `careerStage:${stage}`),
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
  }, [query, sorting, selectedCareerStages]);

  return (
    <peopleDirectoryContext.Provider value={{
      query,
      setQuery,
      sorting,
      setSorting,
      results,
      resultsLoading,
      careerStages,
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
