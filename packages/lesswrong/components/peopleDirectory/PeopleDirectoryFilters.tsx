import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { formatStat } from "../users/EAUserTooltipContent";
import sum from "lodash/sum";
import { PeopleDirectoryFilterDropdown } from "./PeopleDirectoryFilterDropdown";
import { PeopleDirectorySelectOption } from "./PeopleDirectorySelectOption";
import { PeopleDirectoryStaticFilter } from "./PeopleDirectoryStaticFilter";
import { PeopleDirectorySearchableFilter } from "./PeopleDirectorySearchableFilter";
import { PeopleDirectoryClearAll } from "./PeopleDirectoryClearAll";
import { PeopleDirectoryViewToggle } from "./PeopleDirectoryViewToggle";
import { PeopleDirectoryCheckOption } from "./PeopleDirectoryCheckOption";
import { PeopleDirectoryAllFiltersDropdown } from "./PeopleDirectoryAllFiltersDropdown";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  desktopFilters: {
    display: "flex",
    gap: "4px",
    flexGrow: 1,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  mobilePadding: {
    display: "none",
    flexGrow: 1,
    [theme.breakpoints.down("sm")]: {
      display: "block",
    },
  },
  options: {
    display: "flex",
    gap: "4px",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
  },
  filter: {
    display: "flex",
    flexDirection: "column",
    padding: 4,
  },
  filtersDropdown: {
    display: "none",
    [theme.breakpoints.down("sm")]: {
      display: "block",
    },
  },
  columnsDropdown: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  totalResults: {
    display: "flex",
    alignItems: "center",
    marginLeft: 14,
    fontWeight: 600,
    color: theme.palette.grey[600],
  },
  clearAll: {
    padding: 6,
  },
});

const PeopleDirectoryFiltersInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    view,
    filters,
    sorting,
    setSorting,
    isDefaultSorting,
    columns,
    columnsEdited,
    resetColumns,
    totalResults,
    isEmptySearch,
  } = usePeopleDirectory();

  const filterCount = sum(filters.map(
    ({filter: {selectedValues}}) => selectedValues.length),
  );
  return (
    <div className={classes.root}>
      <div className={classes.desktopFilters}>
        {filters.map(({type, filter}) => (
          type === "searchable"
            ? <PeopleDirectorySearchableFilter key={filter.title} filter={filter} />
            : <PeopleDirectoryStaticFilter key={filter.title} filter={filter} />
        ))}
        {totalResults > 0 && !isEmptySearch &&
          <div className={classes.totalResults}>
            {formatStat(totalResults)} {totalResults === 1 ? "result" : "results"}
          </div>
        }
      </div>
      <div className={classes.options}>
        {view === "list" &&
          <>
            <PeopleDirectoryFilterDropdown
              title={`Filter${filterCount > 0 ? `: ${filterCount}` : ""}`}
              icon="FilterBars"
              style="button"
              primary={filterCount > 0}
              rootClassName={classes.filtersDropdown}
            >
              <PeopleDirectoryAllFiltersDropdown />
            </PeopleDirectoryFilterDropdown>
            <PeopleDirectoryFilterDropdown
              title="Sort"
              icon="ArrowsUpDown"
              style="button"
              smallIcon
              className={classes.filter}
            >
              <PeopleDirectoryCheckOption
                label="Default"
                selected={isDefaultSorting}
                onSelect={setSorting.bind(null, null)}
              />
              {columns.map(({label, sortField, defaultSort}) => sortField
                ? (
                  <PeopleDirectoryCheckOption
                    key={label}
                    label={label}
                    selected={sortField === sorting.field}
                    onSelect={setSorting.bind(null, {
                      field: sortField,
                      direction: defaultSort ?? "asc",
                    })}
                  />
                )
                : null
              )}
            </PeopleDirectoryFilterDropdown>
            <PeopleDirectoryFilterDropdown
              title="Columns"
              icon="ViewColumns"
              style="button"
              className={classes.filter}
              rootClassName={classes.columnsDropdown}
            >
              {columns.filter(({hideable}) => hideable).map((state) => (
                <PeopleDirectorySelectOption state={state} key={state.value} />
              ))}
              {columnsEdited &&
                <div className={classes.clearAll}>
                  <PeopleDirectoryClearAll text="Reset" onClear={resetColumns} />
                </div>
              }
            </PeopleDirectoryFilterDropdown>
          </>
        }
        <div className={classes.mobilePadding} />
        <PeopleDirectoryViewToggle />
      </div>
    </div>
  );
}

export const PeopleDirectoryFilters = registerComponent(
  "PeopleDirectoryFilters",
  PeopleDirectoryFiltersInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryFilters: typeof PeopleDirectoryFilters
  }
}
