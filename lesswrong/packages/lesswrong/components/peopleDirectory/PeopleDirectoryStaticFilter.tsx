import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type { MultiSelectResult } from "../hooks/useMultiSelect";
import PeopleDirectorySelectOption from "@/components/peopleDirectory/PeopleDirectorySelectOption";
import PeopleDirectoryClearAll from "@/components/peopleDirectory/PeopleDirectoryClearAll";
import PeopleDirectoryFilterDropdown from "@/components/peopleDirectory/PeopleDirectoryFilterDropdown";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: 4,
  },
  clearAll: {
    padding: 6,
  },
});

const PeopleDirectoryStaticFilter = ({
  filter: {state, selectedValues, clear, summary},
  justContent,
  classes,
}: {
  filter: MultiSelectResult,
  justContent?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
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
        className={classes.root}
      >
        {children}
      </PeopleDirectoryFilterDropdown>
    );
  }, [justContent, summary, selectedValues.length, classes]);
  return (
    <Wrapper>
      {state.map((item) => (
        <PeopleDirectorySelectOption state={item} key={item.value} />
      ))}
      {selectedValues.length > 1 &&
        <div className={classes.clearAll}>
          <PeopleDirectoryClearAll onClear={clear} />
        </div>
      }
    </Wrapper>
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

export default PeopleDirectoryStaticFilterComponent;
