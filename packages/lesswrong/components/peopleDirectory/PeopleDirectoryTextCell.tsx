import React from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import LWTooltip from "../common/LWTooltip";

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

const styles = defineStyles('PeopleDirectoryTextCell', (theme: ThemeType) => ({
  root: {
    ...textCellStyles(theme),
  },
  empty: {
    ...emptyTextCellStyles(theme),
  },
}));

export const PeopleDirectoryTextCell = ({user, fieldName}: {
  user: SearchUser,
  fieldName: keyof SearchUser,
}) => {
  const classes = useStyles(styles);
  const text = String(user[fieldName] || "").trim() || EMPTY_TEXT_PLACEHOLDER;
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
