import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { getSearchClient } from "../../lib/search/searchUtil";

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
}

const peopleDirectoryContext = createContext<PeopleDirectoryContext>({
  query: "",
  setQuery: () => {},
  sorting: null,
  setSorting: () => {},
  results: [],
  resultsLoading: false,
});

export const PeopleDirectoryProvider = ({children}: {children: ReactNode}) => {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<PeopleDirectorySorting | null>(null);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    setResultsLoading(true);
    const searchClient = getSearchClient();
    void (async () => {
      try {
          const sortString = sorting
            ? `_${sorting.field}:${sorting.direction}`
            : "";
          const results = await searchClient.search([
            {
              indexName: "test_users" + sortString,
              query,
              params: {
                query,
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
  }, [query, sorting]);

  return (
    <peopleDirectoryContext.Provider value={{
      query,
      setQuery,
      sorting,
      setSorting,
      results,
      resultsLoading,
    }}>
      {children}
    </peopleDirectoryContext.Provider>
  );
}

export const usePeopleDirectory = () => useContext(peopleDirectoryContext);
