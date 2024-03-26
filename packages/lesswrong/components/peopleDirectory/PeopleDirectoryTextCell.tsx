import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";

export const cellTextStyles = (theme: ThemeType) => ({
  color: theme.palette.grey[1000],
  fontSize: 13,
  fontWeight: 500,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  "-webkit-line-clamp": 2,
  "-webkit-box-orient": "vertical",
});

const styles = (theme: ThemeType) => ({
  root: {
    ...cellTextStyles(theme),
  },
  empty: {
    color: theme.palette.grey[600],
  },
});

const EMPTY = "–";

export const PeopleDirectoryTextCell = ({user, fieldName, classes}: {
  user: SearchUser,
  fieldName: keyof SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const text = user[fieldName] || EMPTY;
  const {LWTooltip} = Components;
  return (
    <LWTooltip title={user[fieldName]}>
      <div className={classNames(classes.root, {
        [classes.empty]: text === EMPTY,
      })}>
        {text}
      </div>
    </LWTooltip>
  );
}

const PeopleDirectoryTextCellComponent = registerComponent(
  "PeopleDirectoryTextCell",
  PeopleDirectoryTextCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryTextCell: typeof PeopleDirectoryTextCellComponent
  }
}
