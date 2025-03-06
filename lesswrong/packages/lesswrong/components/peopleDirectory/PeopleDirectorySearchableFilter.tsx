import React, { Fragment, ReactNode, useCallback, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type { SearchableMultiSelectResult } from "../hooks/useSearchableMultiSelect";
import PeopleDirectoryInput from "@/components/peopleDirectory/PeopleDirectoryInput";
import { Loading } from "@/components/vulcan-core/Loading";
import PeopleDirectorySelectOption from "@/components/peopleDirectory/PeopleDirectorySelectOption";
import PeopleDirectoryClearAll from "@/components/peopleDirectory/PeopleDirectoryClearAll";
import PeopleDirectoryFilterDropdown from "@/components/peopleDirectory/PeopleDirectoryFilterDropdown";

const styles = (theme: ThemeType) => ({
  search: {
    padding: 4,
  },
  noResults: {
    color: theme.palette.grey[600],
    padding: 16,
  },
  loading: {
    margin: 16,
  },
  results: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    display: "flex",
    flexDirection: "column",
    padding: 4,
  },
  result: {
    padding: 8,
  },
  grandfatheredHr: {
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    width: "100%",
    margin: "4px 0",
  },
  clearAll: {
    padding: 8,
  },
});

const PeopleDirectorySearchableFilter = ({
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
  justContent,
  classes,
}: {
  filter: SearchableMultiSelectResult,
  justContent?: boolean,
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

  const Wrapper = useCallback(({children}: {children: ReactNode}) => {
    if (justContent) {
      return (
        <>{children}</>
      );
    }
    return (
      <PeopleDirectoryFilterDropdown
        title={summary}
        active={selectedValues.length > 0}
        onOpen={onOpen}
        onClose={onClose}
      >
        {children}
      </PeopleDirectoryFilterDropdown>
    );
  }, [justContent, summary, selectedValues.length, onOpen, onClose]);
  return (
    <Wrapper>
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
          {showLoading && <Loading className={classes.loading} />}
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
    </Wrapper>
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

export default PeopleDirectorySearchableFilterComponent;
