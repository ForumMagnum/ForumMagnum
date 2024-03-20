import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { MultiSelectState, buildMultiSelectSummary } from "../hooks/useMultiSelect";
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
    padding: "16px 0",
  },
  result: {
    padding: "0 16px",
  },
  grandfatheredHr: {
    borderBottom: `1px solid ${theme.palette.grey[600]}`,
    width: "100%",
    margin: "4px 0",
  },
  clearAll: {
    padding: "0 16px",
  },
});

type Suggestion = MultiSelectState & {
  grandfathered: boolean,
}

export const PeopleDirectorySearchableFilter = ({title, facetField, classes}: {
  title: string,
  facetField: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const ref = useRef<HTMLInputElement | null>(null);

  const selectedValues: string[] = useMemo(() => {
    return suggestions.filter(({selected}) => selected).map(({value}) => value);
  }, [suggestions]);

  const summary = buildMultiSelectSummary(title, suggestions, selectedValues);

  const onClear = useCallback(() => {
    setSearch("");
    setLoading(false);
    setSuggestions([]);
  }, []);

  const onOpen = useCallback(() => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus()
      }
    }, 0);
  }, [ref]);

  const onClose = useCallback(() => {
    setSearch("");
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
      return hits ?? [];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Facet search error:", e);
      return [];
    }
  }, [facetField]);

  const getWithCache = useLRUCache<string, Promise<string[]>>(fetchSuggestions);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      const hits = search ? await getWithCache(search) : [];
      setSuggestions((oldSuggestions) => {
        const grandfathered = suggestions
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

  const {
    PeopleDirectoryFilterDropdown, PeopleDirectoryInput, Loading,
    PeopleDirectorySelectOption, PeopleDirectoryClearAll,
  } = Components;
  return (
    <PeopleDirectoryFilterDropdown
      title={summary}
      active={selectedValues.length > 0}
      onOpen={onOpen}
      onClose={onClose}
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
          {!loading && suggestions.map((suggestion, i) => (
            <Fragment key={suggestion.value}>
              {!!grandfatheredCount && i === grandfatheredCount &&
                <div className={classes.grandfatheredHr} />
              }
              <PeopleDirectorySelectOption
                state={suggestion}
                className={classes.result}
              />
            </Fragment>
          ))}
          {!loading && selectedValues.length > 1 &&
            <div className={classes.clearAll}>
              <PeopleDirectoryClearAll onClear={onClear} />
            </div>
          }
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
