import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { getSearchClient } from "../../lib/search/searchUtil";

type PeopleDirectoryContext = {
  query: string,
  setQuery: (query: string) => void,
  results: SearchUser[],
}

const peopleDirectoryContext = createContext<PeopleDirectoryContext>({
  query: "",
  setQuery: () => {},
  results: [],
});

export const PeopleDirectoryProvider = ({children}: {children: ReactNode}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);

  useEffect(() => {
    const searchClient = getSearchClient();
    void (async () => {
      const results = await searchClient.search([
        {
          indexName: "test_users",
          query,
          params: {},
        },
      ]);
      setResults(results?.results?.[0]?.hits ?? []);
    })();
  }, [query]);

  return (
    <peopleDirectoryContext.Provider value={{query, setQuery, results}}>
      {children}
    </peopleDirectoryContext.Provider>
  );
}

export const usePeopleDirectory = () => useContext(peopleDirectoryContext);
