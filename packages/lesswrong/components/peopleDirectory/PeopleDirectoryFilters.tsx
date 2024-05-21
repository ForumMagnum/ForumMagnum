import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { formatStat } from "../users/EAUserTooltipContent";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  filters: {
    display: "flex",
    gap: "4px",
    flexGrow: 1,
  },
  options: {
    display: "flex",
    gap: "4px",
  },
  columnsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: 16,
  },
  totalResults: {
    display: "flex",
    alignItems: "center",
    marginLeft: 14,
    fontWeight: 600,
    color: theme.palette.grey[600],
  },
});

export const PeopleDirectoryFilters = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    roles,
    organizations,
    locations,
    careerStages,
    columns,
    columnsEdited,
    resetColumns,
    totalResults,
    isEmptySearch,
  } = usePeopleDirectory();
  const {
    PeopleDirectoryFilterDropdown, PeopleDirectorySelectOption,
    PeopleDirectoryStaticFilter, PeopleDirectorySearchableFilter,
    PeopleDirectoryClearAll,
  } = Components;
  return (
    <div className={classes.root}>
      <div className={classes.filters}>
        <PeopleDirectorySearchableFilter filter={roles} />
        <PeopleDirectorySearchableFilter filter={organizations} />
        <PeopleDirectoryStaticFilter filter={careerStages} />
        <PeopleDirectorySearchableFilter filter={locations} />
        {totalResults > 0 && !isEmptySearch &&
          <div className={classes.totalResults}>
            {formatStat(totalResults)} {totalResults === 1 ? "result" : "results"}
          </div>
        }
      </div>
      <div className={classes.options}>
        <PeopleDirectoryFilterDropdown
          title="Columns"
          icon="ViewColumns"
          style="button"
          className={classes.columnsList}
        >
          {columns.filter(({hideable}) => hideable).map((state) => (
            <PeopleDirectorySelectOption state={state} key={state.value} />
          ))}
          {columnsEdited &&
            <div>
              <PeopleDirectoryClearAll text="Reset" onClear={resetColumns} />
            </div>
          }
        </PeopleDirectoryFilterDropdown>
      </div>
    </div>
  );
}

const PeopleDirectoryFiltersComponent = registerComponent(
  "PeopleDirectoryFilters",
  PeopleDirectoryFilters,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryFilters: typeof PeopleDirectoryFiltersComponent
  }
}
