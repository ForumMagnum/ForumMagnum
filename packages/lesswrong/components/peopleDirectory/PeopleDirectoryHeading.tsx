import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { PeopleDirectoryColumn } from "./peopleDirectoryColumns";
import { usePeopleDirectory } from "./usePeopleDirectory";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 6px",
  },
  icon: {
    cursor: "pointer",
    width: 16,
  },
});

export const PeopleDirectoryHeading = ({column, classes}: {
  column: PeopleDirectoryColumn,
  classes: ClassesType<typeof styles>,
}) => {
  const {sorting, setSorting} = usePeopleDirectory();

  const onToggleSort = useCallback(() => {
    if (!column.sortField) {
      return;
    } else if (sorting?.field === column.sortField) {
      if (sorting.direction === "asc") {
        setSorting({
          field: column.sortField,
          direction: "desc",
        });
      } else {
        setSorting(null);
      }
    } else {
      setSorting({
        field: column.sortField,
        direction: "asc",
      });
    }
  }, [sorting, setSorting, column.sortField]);

  const {ForumIcon} = Components;
  return (
    <div className={classes.root}>
      {column.label}
      {column.sortField &&
        <ForumIcon
          icon="ChevronUpDown"
          onClick={onToggleSort}
          className={classes.icon}
        />
      }
    </div>
  );
}

const PeopleDirectoryHeadingComponent = registerComponent(
  "PeopleDirectoryHeading",
  PeopleDirectoryHeading,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryHeading: typeof PeopleDirectoryHeadingComponent
  }
}
