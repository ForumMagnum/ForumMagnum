import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CAREER_STAGES } from "../../lib/collections/users/schema";
import { useMultiSelect } from "../hooks/useMultiSelect";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  filters: {
    display: "flex",
    flexGrow: 1,
  },
  options: {
    display: "flex",
  },
  multiSelect: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  clearAll: {
    display: "inline-block",
    cursor: "pointer",
    userSelect: "none",
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.primary.dark,
  },
});

export const PeopleDirectoryFilters = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    state: careerStages,
    selectedValues: selectedCareerStages,
    clear: clearCareerStages,
  } = useMultiSelect(CAREER_STAGES);

  const {PeopleDirectoryFilterDropdown, PeopleDirectorySelectOption} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.filters}>
        <PeopleDirectoryFilterDropdown title="Role" className={classes.multiSelect}>
          {careerStages.map((state) => (
            <PeopleDirectorySelectOption state={state} key={state.value} />
          ))}
          {selectedCareerStages.length > 1 &&
            <div>
              <div onClick={clearCareerStages} className={classes.clearAll}>
                Clear all
              </div>
            </div>
          }
        </PeopleDirectoryFilterDropdown>
      </div>
      <div className={classes.options}>
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
