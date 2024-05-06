import React, { FC } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { useClickableCell } from "../common/useClickableCell";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";
import { PeopleDirectoryColumn } from "./peopleDirectoryColumns";

export const COLUMN_HORIZONTAL_PADDING = 10;

const styles = (theme: ThemeType) => ({
  root: {
    display: "contents",
    cursor: "pointer",
    "&:hover > *": {
      background: theme.palette.grey[30],
    },
    "&:hover .PeopleDirectoryUserCell-message": {
      display: "block",
    },
  },
  cell: {
    display: "flex",
    alignItems: "center",
    height: 64,
    padding: `12px ${COLUMN_HORIZONTAL_PADDING}px`,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
});

const Column: FC<{
  result?: SearchUser,
  column: PeopleDirectoryColumn,
  classes: ClassesType<typeof styles>,
}> = ({result, column, classes}) => {
  if (column.hideable && column.hidden) {
    return null;
  }
  const {
    componentName,
    props = {},
    skeletonComponentName = "PeopleDirectorySkeletonTextCell",
    skeletonProps = {},
  } = column;
  const Skeleton: AnyBecauseHard = Components[skeletonComponentName];
  const Component: AnyBecauseHard = Components[componentName];
  return (
    <div className={classes.cell}>
      {result
        ? <Component user={result} {...props} />
        : <Skeleton {...skeletonProps} />
      }
    </div>
  );
}

export const PeopleDirectoryResultRow = ({result, classes}: {
  result?: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const {onClick} = useClickableCell({
    href: result ? `${userGetProfileUrl(result)}?from=people_directory` : "#",
    ignoreLinks: true,
    openInNewTab: true,
  });
  const {columns} = usePeopleDirectory();
  return (
    <div className={classes.root} onClick={onClick}>
      {columns.map((column) => (
        <Column
          key={column.label}
          result={result}
          column={column}
          classes={classes}
        />
      ))}
    </div>
  );
}

const PeopleDirectoryResultRowComponent = registerComponent(
  "PeopleDirectoryResultRow",
  PeopleDirectoryResultRow,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResultRow: typeof PeopleDirectoryResultRowComponent
  }
}
