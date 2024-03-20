import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";

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
  } = usePeopleDirectory();
  const {
    PeopleDirectoryFilterDropdown, PeopleDirectorySelectOption,
    PeopleDirectoryStaticFilter, PeopleDirectorySearchableFilter,
  } = Components;
  return (
    <div className={classes.root}>
      <div className={classes.filters}>
        <PeopleDirectorySearchableFilter filter={roles} />
        <PeopleDirectorySearchableFilter filter={organizations} />
        <PeopleDirectoryStaticFilter filter={careerStages} />
        <PeopleDirectorySearchableFilter filter={locations} />
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
