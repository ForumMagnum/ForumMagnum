import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { MultiSelectResult } from "../hooks/useMultiSelect";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: 16,
  },
});

export const PeopleDirectoryStaticFilter = ({
  filter: {state, selectedValues, clear, summary},
  classes,
}: {
  filter: MultiSelectResult,
  classes: ClassesType<typeof styles>,
}) => {
  const {
    PeopleDirectoryFilterDropdown, PeopleDirectorySelectOption,
    PeopleDirectoryClearAll,
  } = Components;
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
          <PeopleDirectoryClearAll onClear={clear} />
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
