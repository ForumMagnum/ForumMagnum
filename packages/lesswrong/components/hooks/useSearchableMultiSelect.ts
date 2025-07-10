import { useCallback, useEffect, useMemo, useState } from "react";
import { MultiSelectState, buildMultiSelectSummary } from "./useMultiSelect";
import { useLRUCache } from "./useLRUCache";
import { useSearchAnalytics } from "../search/useSearchAnalytics";
import { captureException } from "@sentry/core";
import { getSearchClient } from "@/lib/search/searchUtil";
import { algoliaPrefixSetting } from '@/lib/instanceSettings';
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { MULTISELECT_SUGGESTION_LIMIT } from "@/lib/collections/users/helpers";

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
  title: string,
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

/**
 * Searchable multiselect inputs can either search a user facet field or an
 * elasticsearch index
 */
type MultiSelectSearchTarget = {
  facetField: string,
  elasticField?: never,
} | {
  facetField?: never,
  elasticField: {index: string, fieldName: string},
}

const fetchFromUserFacet = async (
  facetField: string,
  query: string,
): Promise<string[]> => {
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
  return hits ?? [];
}

const fetchFromElasticIndex = async (
  index: string,
  fieldName: string,
  query: string,
): Promise<string[]> => {
  const response = await getSearchClient().search([
    {
      indexName: algoliaPrefixSetting.get() + index,
      query,
      params: {
        query,
        facetFilters: [],
        page: 0,
        hitsPerPage: MULTISELECT_SUGGESTION_LIMIT,
      },
    },
  ]);
  const hits = response?.results?.[0]?.hits ?? [];
  return filterNonnull(hits.map((hit) => hit[fieldName]));
}

const useStableSuggestions = (suggestions: string[] = []) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => suggestions, [suggestions.join("")]);

export const useSearchableMultiSelect = ({
  title,
  placeholder,
  facetField,
  elasticField,
  defaultSuggestions: defaultSuggestions_,
}: {
  title: string,
  placeholder?: string,
  defaultSuggestions?: string[],
} & MultiSelectSearchTarget): SearchableMultiSelectResult => {
  const captureSearch = useSearchAnalytics();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchableMultiSelectState[]>([]);
  const defaultSuggestions = useStableSuggestions(defaultSuggestions_);

  const filteredSelectedValues = suggestions.filter(
    ({selected}) => selected).map(({value}) => value,
  );
  const selectedValues: string[] = useMemo(() => {
    return filteredSelectedValues;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSelectedValues.join(" ")]);

  const summary = buildMultiSelectSummary(title, suggestions, selectedValues);
  placeholder ??= `Type ${title.toLowerCase()}...`;

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

  const hitToSuggestion = useCallback((hit: string, selected = false) => ({
    value: hit,
    label: hit,
    selected,
    onToggle: onToggle.bind(null, hit),
    grandfathered: false,
  }), [onToggle]);

  const clear = useCallback(() => {
    setSearch("");
    setLoading(false);
    setSuggestions(defaultSuggestions.map((s) => hitToSuggestion(s)));
  }, [defaultSuggestions, hitToSuggestion]);

  const {index, fieldName} = elasticField ?? {};

  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      const hits = await (index && fieldName
        ? fetchFromElasticIndex(index, fieldName, query)
        : fetchFromUserFacet(facetField!, query));
      captureSearch("userFacetSearch", {
        facetField,
        index,
        fieldName,
        query,
        hitCount: hits.length ?? 0,
      });
      return hits ?? [];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Facet search error:", e);
      captureException(e);
      return [];
    }
  }, [captureSearch, facetField, index, fieldName]);

  const getWithCache = useLRUCache<string, Promise<string[]>>(fetchSuggestions);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      const hits = search ? await getWithCache(search) : defaultSuggestions;
      setSuggestions((oldSuggestions) => {
        const grandfathered = oldSuggestions
          .filter(({value, selected}) => selected && !hits.includes(value))
          .map((suggestion) => ({
            ...suggestion,
            grandfathered: true,
            onToggle: onRemove.bind(null, suggestion.value),
          }));
        return grandfathered.concat(hits.map((hit: string) => hitToSuggestion(
          hit,
          !!oldSuggestions.find(({value}) => value === hit)?.selected,
        )));
      });
      setLoading(false);
    })();
  }, [search, getWithCache, onToggle, onRemove, defaultSuggestions, hitToSuggestion]);

  const grandfatheredCount = suggestions
    .filter(({grandfathered}) => grandfathered)
    .length;

  return {
    title,
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
