import React from "react";
import moment from "moment";
import { textCellStyles } from "./PeopleDirectoryTextCell";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('PeopleDirectoryDateCell', (theme: ThemeType) => ({
  root: {
    ...textCellStyles(theme),
  },
}));

export const PeopleDirectoryDateCell = ({user, fieldName, format}: {
  user: SearchUser,
  fieldName: keyof SearchUser,
  format: string,
}) => {
  const classes = useStyles(styles);
  const date = moment(String(user[fieldName]));
  return (
    <div className={classes.root}>
      {date.format(format)}
    </div>
  );
}
