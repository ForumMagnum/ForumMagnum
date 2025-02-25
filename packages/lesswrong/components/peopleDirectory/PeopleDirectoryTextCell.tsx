import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";

export const EMPTY_TEXT_PLACEHOLDER = "–";

export const textCellStyles = (theme: ThemeType) => ({
  color: theme.palette.grey[1000],
  fontSize: 13,
  fontWeight: 500,
  lineHeight: "1.4rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  "-webkit-line-clamp": 2,
  "-webkit-box-orient": "vertical",
});

export const emptyTextCellStyles = (theme: ThemeType) => ({
    color: theme.palette.grey[600],
});

const styles = (theme: ThemeType) => ({
  root: {
    ...textCellStyles(theme),
  },
  empty: {
    ...emptyTextCellStyles(theme),
  },
});

const PeopleDirectoryTextCell = ({user, fieldName, classes}: {
  user: SearchUser,
  fieldName: keyof SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const text = String(user[fieldName] || "").trim() || EMPTY_TEXT_PLACEHOLDER;
  const {LWTooltip} = Components;
  return (
    <LWTooltip title={user[fieldName] ? String(user[fieldName]) : undefined}>
      <div className={classNames(classes.root, {
        [classes.empty]: text === EMPTY_TEXT_PLACEHOLDER,
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
