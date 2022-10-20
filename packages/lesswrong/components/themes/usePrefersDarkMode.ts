import { useState, useEffect } from "react";

const buildQuery = () => "window" in globalThis
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : {
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }; // TODO: What to do here during SSR?

export const usePrefersDarkMode = () => {
  const [query] = useState(buildQuery());
  const [prefersDarkMode, setPrefersDarkMode] = useState(query.matches);

  useEffect(() => {
      const handler = ({matches}: MediaQueryListEvent) => setPrefersDarkMode(matches);
      query.addEventListener("change", handler);
      return () => query.removeEventListener("change", handler);
  }, [query]);

  return prefersDarkMode;
}
