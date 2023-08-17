import React, { createContext, useContext, useState, useEffect } from "react";
import { isClient } from "../../lib/executionEnvironment";
import { captureEvent } from "../../lib/analyticsEvents";

const prefersDarkModeContext = createContext(false);

const buildQuery = () =>
  isClient && "matchMedia" in window
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

export const PrefersDarkModeProvider = ({children}: {
  children: React.ReactNode
}) => {
  const [query] = useState(() => buildQuery());
  const [prefersDarkMode, setPrefersDarkMode] = useState(query.matches);

  useEffect(() => {
    const handler = ({matches}: MediaQueryListEvent) => {
      setPrefersDarkMode(matches);
      captureEvent("prefersDarkModeChange", {
        prefersDarkMode: matches,
      });
    }
    // Check that query.addEventListener exists before using it, because on
    // some browsers (older iOS Safari) it doesn't.
    if (query.addEventListener) {
      query.addEventListener("change", handler);
      return () => query.removeEventListener("change", handler);
    }
  }, [query]);

  return (
    <prefersDarkModeContext.Provider value={prefersDarkMode}>
      {children}
    </prefersDarkModeContext.Provider>
  );
}

export const usePrefersDarkMode = () => useContext(prefersDarkModeContext);

export const devicePrefersDarkMode = () => {
  const query = buildQuery();
  return query?.matches ?? false;
}
