import React from "react";
import { formatStat } from "../users/EAUserTooltipContent";
import { textCellStyles } from "./PeopleDirectoryTextCell";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('PeopleDirectoryNumberCell', (theme: ThemeType) => ({
  root: {
    ...textCellStyles(theme),
    whiteSpace: "nowrap",
  },
}));

export const PeopleDirectoryNumberCell = ({user, fieldName}: {
  user: SearchUser,
  fieldName: keyof SearchUser,
}) => {
  const classes = useStyles(styles);
  const value = Number(user[fieldName] ?? 0);
  return (
    <div className={classes.root}>
      {formatStat(value)}
    </div>
  );
}
