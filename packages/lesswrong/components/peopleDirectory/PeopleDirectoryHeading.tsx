import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { PeopleDirectoryColumn } from "./peopleDirectoryColumns";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { COLUMN_HORIZONTAL_PADDING } from "./PeopleDirectoryResultRow";
import classNames from "classnames";
import { ForumIcon } from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 600,
    padding: `8px ${COLUMN_HORIZONTAL_PADDING}px`,
    whiteSpace: "nowrap",
    color: theme.palette.grey[600],
  },
  currentSort: {
    color: theme.palette.grey[1000],
  },
  icon: {
    cursor: "pointer",
    width: 16,
  },
});

const PeopleDirectoryHeadingInner = ({column, classes}: {
  column: PeopleDirectoryColumn,
  classes: ClassesType<typeof styles>,
}) => {
  const {sorting, setSorting} = usePeopleDirectory();

  const onToggleSort = useCallback(() => {
    const firstSort = column.defaultSort ?? "asc";
    const secondSort = firstSort === "asc" ? "desc" : "asc";
    if (!column.sortField) {
      return;
    } else if (sorting?.field === column.sortField) {
      if (sorting.direction === firstSort) {
        setSorting({
          field: column.sortField,
          direction: secondSort,
        });
      } else {
        setSorting(null);
      }
    } else {
      setSorting({
        field: column.sortField,
        direction: firstSort,
      });
    }
  }, [sorting, setSorting, column.sortField, column.defaultSort]);

  const isCurrentSort = column.sortField && sorting?.field === column.sortField;
  return (
    <div className={classNames(
      classes.root,
      isCurrentSort && classes.currentSort,
    )}>
      {column.shortLabel ?? column.label}
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

export const PeopleDirectoryHeading = registerComponent(
  "PeopleDirectoryHeading",
  PeopleDirectoryHeadingInner,
  {styles},
);


