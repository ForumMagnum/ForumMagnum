import { useCallback, useEffect, useMemo, useState } from "react";
import { MultiSelectState, buildMultiSelectSummary } from "./useMultiSelect";
import { useLRUCache } from "./useLRUCache";
import { useSearchAnalytics } from "../search/useSearchAnalytics";
import { captureException } from "@sentry/core";

export type SearchableMultiSelectState = MultiSelectState & {
  /**
   * If the user enters a search, selects and option, then searches for
   * something else then the option they selected will be kept even if it
   * doesn't match the new search - this option is considered to be
   * "grandfathered" into the results.
   */
  grandfathered: boolean,
}

export type SearchableMultiSelectResult = {
  search: string,
  setSearch: (value: string) => void,
  loading: boolean,
  suggestions: SearchableMultiSelectState[],
  selectedValues: string[],
  summary: string,
  placeholder: string,
  clear: () => void,
  grandfatheredCount: number,
}

export const useSearchableMultiSelect = ({title, facetField}: {
  title: string,
  facetField: string,
}): SearchableMultiSelectResult => {
  const captureSearch = useSearchAnalytics();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchableMultiSelectState[]>([]);

  const selectedValues: string[] = useMemo(() => {
    return suggestions.filter(({selected}) => selected).map(({value}) => value);
  }, [suggestions]);

  const summary = buildMultiSelectSummary(title, suggestions, selectedValues);
  const placeholder = `Type ${title.toLowerCase()}...`;

  const clear = useCallback(() => {
    setSearch("");
    setLoading(false);
    setSuggestions([]);
  }, []);

  const onRemove = useCallback((removeValue: string) => {
    setSuggestions((suggestions) =>
      suggestions.filter(({value}) => value !== removeValue,
    ));
  }, []);

  const onToggle = useCallback((value: string) => {
    setSuggestions((suggestions) => suggestions.map((suggestion) => {
      return suggestion.value === value
        ? {
          ...suggestion,
          selected: !suggestion.selected,
        }
        : suggestion;
    }));
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      const response = await fetch("/api/search/userFacets", {
        method: "POST",
        body: JSON.stringify({
          facetField,
          query,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const {hits} = await response.json();
      captureSearch("userFacetSearch", {
        facetField,
        query,
        hitCount: hits?.length ?? 0,
      });
      return hits ?? [];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Facet search error:", e);
      captureException(e);
      return [];
    }
  }, [captureSearch, facetField]);

  const getWithCache = useLRUCache<string, Promise<string[]>>(fetchSuggestions);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      const hits = search ? await getWithCache(search) : [];
      setSuggestions((oldSuggestions) => {
        const grandfathered = oldSuggestions
          .filter(({value, selected}) => selected && !hits.includes(value))
          .map((suggestion) => ({
            ...suggestion,
            grandfathered: true,
            onToggle: onRemove.bind(null, suggestion.value),
          }));
        return grandfathered.concat(hits.map((hit: string) => ({
          value: hit,
          label: hit,
          selected: !!oldSuggestions.find(({value}) => value === hit)?.selected,
          onToggle: onToggle.bind(null, hit),
          grandfathered: false,
        })));
      });
      setLoading(false);
    })();
  }, [search, getWithCache, onToggle, onRemove]);

  const grandfatheredCount = suggestions
    .filter(({grandfathered}) => grandfathered)
    .length;

  return {
    search,
    setSearch,
    loading,
    suggestions,
    selectedValues,
    summary,
    placeholder,
    clear,
    grandfatheredCount,
  };
}
