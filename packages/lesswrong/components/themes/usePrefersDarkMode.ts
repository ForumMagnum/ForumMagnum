import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { isClient } from "../../lib/executionEnvironment";

const DARK_MODE_COOKIE = "prefersDarkMode";

const buildQuery = (cookies: Record<string, any>) =>
  isClient && "matchMedia" in window
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : {
      matches: cookies[DARK_MODE_COOKIE] === "true",
      addEventListener: () => {},
      removeEventListener: () => {},
    };

export const usePrefersDarkMode = () => {
  const [cookies, setCookie] = useCookies();
  const [query] = useState(() => buildQuery(cookies));
  const [prefersDarkMode, setPrefersDarkMode] = useState(query.matches);

  useEffect(() => {
      const handler = ({matches}: MediaQueryListEvent) => setPrefersDarkMode(matches);
      query.addEventListener("change", handler);
      return () => query.removeEventListener("change", handler);
  }, [query]);

  useEffect(() => {
    setCookie(DARK_MODE_COOKIE, prefersDarkMode ? "true" : "false");
  }, [prefersDarkMode, setCookie]);

  return prefersDarkMode;
}
