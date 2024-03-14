import React, { ReactNode, createContext, useContext, useMemo, useState } from "react";

type PeopleDirectoryContext = {
  query: string,
  setQuery: (query: string) => void,
}

const peopleDirectoryContext = createContext<PeopleDirectoryContext>({
  query: "",
  setQuery: () => {},
});

export const PeopleDirectoryProvider = ({children}: {children: ReactNode}) => {
  const [query, setQuery] = useState("");
  const value = useMemo(() => {
    return {
      query,
      setQuery,
    };
  }, [query, setQuery]);
  return (
    <peopleDirectoryContext.Provider value={value}>
      {children}
    </peopleDirectoryContext.Provider>
  );
}

export const usePeopleDirectory = () => useContext(peopleDirectoryContext);
