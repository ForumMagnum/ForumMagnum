import React, { Fragment, useCallback, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { SearchableMultiSelectResult } from "../hooks/useSearchableMultiSelect";

const styles = (theme: ThemeType) => ({
  search: {
    padding: 4,
  },
  noResults: {
    color: theme.palette.grey[600],
    padding: "0 16px",
  },
  results: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px 0",
  },
  result: {
    padding: "0 16px",
  },
  grandfatheredHr: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    width: "100%",
    margin: "4px 0",
  },
  clearAll: {
    padding: "0 16px",
  },
});

export const PeopleDirectorySearchableFilter = ({
  filter: {
    search,
    setSearch,
    loading,
    suggestions,
    selectedValues,
    summary,
    placeholder,
    clear,
    grandfatheredCount,
  },
  classes,
}: {
  filter: SearchableMultiSelectResult,
  classes: ClassesType<typeof styles>,
}) => {
  const ref = useRef<HTMLInputElement | null>(null);

  const onOpen = useCallback(() => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus()
      }
    }, 0);
  }, [ref]);

  const onClose = useCallback(() => {
    setSearch("");
  }, [setSearch]);

  const showLoading = loading;
  const showNoResults = search && !loading && suggestions.length === 0;
  const showResults = !loading && suggestions.length > 0;
  const showClearAll = !loading && selectedValues.length > 0;
  const showAnything = showLoading || showNoResults || showResults || showClearAll;

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
          placeholder={placeholder}
          inputRef={ref}
          noBorder
        />
      </div>
      {showAnything &&
        <div className={classes.results}>
          {showLoading && <Loading />}
          {showNoResults &&
            <div className={classes.noResults}>No results found</div>
          }
          {showResults && suggestions.map((suggestion, i) => (
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
          {showClearAll &&
            <div className={classes.clearAll}>
              <PeopleDirectoryClearAll onClear={clear} />
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
