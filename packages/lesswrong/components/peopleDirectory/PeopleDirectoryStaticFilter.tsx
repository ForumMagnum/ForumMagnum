import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { MultiSelectResult } from "../hooks/useMultiSelect";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: 16,
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

export const PeopleDirectoryStaticFilter = ({
  filter: {state, selectedValues, clear, summary},
  classes,
}: {
  filter: MultiSelectResult,
  classes: ClassesType<typeof styles>,
}) => {
  const {PeopleDirectoryFilterDropdown, PeopleDirectorySelectOption} = Components;
  return (
    <PeopleDirectoryFilterDropdown
      title={summary}
      active={selectedValues.length > 0}
      className={classes.root}
    >
      {state.map((item) => (
        <PeopleDirectorySelectOption state={item} key={item.value} />
      ))}
      {selectedValues.length > 1 &&
        <div>
          <div onClick={clear} className={classes.clearAll}>
            Clear all
          </div>
        </div>
      }
    </PeopleDirectoryFilterDropdown>
  );
}

const PeopleDirectoryStaticFilterComponent = registerComponent(
  "PeopleDirectoryStaticFilter",
  PeopleDirectoryStaticFilter,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryStaticFilter: typeof PeopleDirectoryStaticFilterComponent
  }
}
