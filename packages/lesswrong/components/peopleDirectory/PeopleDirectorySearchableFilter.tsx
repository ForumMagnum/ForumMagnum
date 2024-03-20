import React, { useCallback, useEffect, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { MultiSelectState } from "../hooks/useMultiSelect";
import { useLRUCache } from "../hooks/useLRUCache";

const styles = (theme: ThemeType) => ({
  search: {
    padding: 4,
  },
  noResults: {
    color: theme.palette.grey[600],
  },
  results: {
    borderTop: `1px solid ${theme.palette.grey[600]}`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: 16,
  },
});

export const PeopleDirectorySearchableFilter = ({title, facetField, classes}: {
  title: string,
  facetField: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MultiSelectState[]>([]);
  const ref = useRef<HTMLInputElement | null>(null);

  const onOpen = useCallback(() => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus()
      }
    }, 0);
  }, [ref]);

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
      return hits ?? [];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Facet search error:", e);
      return [];
    }
  }, [facetField]);

  const getWithCache = useLRUCache<string, Promise<string[]>>(fetchSuggestions);

  useEffect(() => {
    if (search) {
      setLoading(true);
      setSuggestions([]);
      void (async () => {
        const hits = await getWithCache(search);
        setSuggestions(hits.map((hit: string) => ({
          value: hit,
          label: hit,
          selected: false,
          onToggle: onToggle.bind(null, hit),
        })));
        setLoading(false);
      })();
    }
  }, [search, getWithCache, onToggle]);

  const {
    PeopleDirectoryFilterDropdown, PeopleDirectoryInput, Loading,
    PeopleDirectorySelectOption,
  } = Components;
  return (
    <PeopleDirectoryFilterDropdown
      title={title}
      active={false}
      onOpen={onOpen}
    >
      <div className={classes.search}>
        <PeopleDirectoryInput
          value={search}
          setValue={setSearch}
          placeholder={`Type ${title.toLowerCase()}...`}
          inputRef={ref}
          noBorder
        />
      </div>
      {search &&
        <div className={classes.results}>
          {loading && <Loading />}
          {search && !loading && suggestions.length === 0 &&
            <div className={classes.noResults}>No results found</div>
          }
          {suggestions.map((suggestion) => (
            <PeopleDirectorySelectOption key={suggestion.value} state={suggestion} />
          ))}
        </div>
      }
    </PeopleDirectoryFilterDropdown>
  );
}

const PeopleDirectorySearchableFilterComponent = registerComponent(
  "PeopleDirectorySearchableFilter",
  PeopleDirectorySearchableFilter,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySearchableFilter: typeof PeopleDirectorySearchableFilterComponent
  }
}
