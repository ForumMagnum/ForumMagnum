import { useState, useEffect } from "react";
import { isClient } from "../../lib/executionEnvironment";

const buildQuery = () =>
  isClient && "matchMedia" in window
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

export const usePrefersDarkMode = () => {
  const [query] = useState(() => buildQuery());
  const [prefersDarkMode, setPrefersDarkMode] = useState(query.matches);

  useEffect(() => {
      const handler = ({matches}: MediaQueryListEvent) => setPrefersDarkMode(matches);
      query.addEventListener("change", handler);
      return () => query.removeEventListener("change", handler);
  }, [query]);

  return prefersDarkMode;
}
