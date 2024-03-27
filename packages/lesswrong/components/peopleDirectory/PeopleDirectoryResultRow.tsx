import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { usePeopleDirectory } from "./usePeopleDirectory";
import { useClickableCell } from "../common/useClickableCell";
import { userGetProfileUrl } from "../../lib/collections/users/helpers";

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
    padding: "12px 6px",
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
});

export const PeopleDirectoryResultRow = ({result, classes}: {
  result: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const {onClick} = useClickableCell({
    href: userGetProfileUrl(result),
    ignoreLinks: true,
  });
  const {columns} = usePeopleDirectory();
  return (
    <div className={classes.root} onClick={onClick}>
      {columns.map((column) => {
        if (column.hideable && column.hidden) {
          return null;
        }
        const {componentName, label, props} = column;
        const Component = Components[componentName] as AnyBecauseTodo;
        return (
          <div key={label} className={classes.cell}>
            <Component user={result} {...props} />
          </div>
        );
      })}
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
