import React, { useCallback, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  search: {
    padding: 16,
  },
  results: {
    borderTop: `1px solid ${theme.palette.grey[600]}`,
    padding: 16,
  },
});

export const PeopleDirectorySearchableFilter = ({title, classes}: {
  title: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLInputElement | null>(null);

  const onOpen = useCallback(() => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus()
      }
    }, 0);
  }, [ref]);

  const {
    PeopleDirectoryFilterDropdown, PeopleDirectoryInput, Loading,
    PeopleDirectorySelectOption,
  } = Components;
  return (
    <PeopleDirectoryFilterDropdown
      title={title}
      active={false}
      onOpen={onOpen}
    >
      <div className={classes.search}>
        <PeopleDirectoryInput
          value={search}
          setValue={setSearch}
          placeholder={`Type ${title.toLowerCase()}...`}
          inputRef={ref}
          noBorder
        />
      </div>
      {search &&
        <div className={classes.results}>
          <Loading />
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
