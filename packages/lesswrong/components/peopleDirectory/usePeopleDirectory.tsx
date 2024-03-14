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
}

const peopleDirectoryContext = createContext<PeopleDirectoryContext>({
  query: "",
  setQuery: () => {},
  sorting: null,
  setSorting: () => {},
  results: [],
});

export const PeopleDirectoryProvider = ({children}: {children: ReactNode}) => {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<PeopleDirectorySorting | null>(null);
  const [results, setResults] = useState<SearchUser[]>([]);

  useEffect(() => {
    const searchClient = getSearchClient();
    void (async () => {
      const results = await searchClient.search([
        {
          indexName: "test_users",
          query,
          params: {
            query,
          },
        },
      ]);
      setResults(results?.results?.[0]?.hits ?? []);
    })();
  }, [query, sorting]);

  return (
    <peopleDirectoryContext.Provider value={{
      query,
      setQuery,
      sorting,
      setSorting,
      results,
    }}>
      {children}
    </peopleDirectoryContext.Provider>
  );
}

export const usePeopleDirectory = () => useContext(peopleDirectoryContext);
