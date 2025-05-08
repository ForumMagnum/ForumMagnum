import React, { ReactNode, useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type { MultiSelectResult } from "../hooks/useMultiSelect";

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

const PeopleDirectoryStaticFilterInner = ({
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
      <Components.PeopleDirectoryFilterDropdown
        title={summary}
        active={selectedValues.length > 0}
        className={classes.root}
      >
        {children}
      </Components.PeopleDirectoryFilterDropdown>
    );
  }, [justContent, summary, selectedValues.length, classes]);

  const {PeopleDirectorySelectOption, PeopleDirectoryClearAll} = Components;
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

export const PeopleDirectoryStaticFilter = registerComponent(
  "PeopleDirectoryStaticFilter",
  PeopleDirectoryStaticFilterInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryStaticFilter: typeof PeopleDirectoryStaticFilter
  }
}
