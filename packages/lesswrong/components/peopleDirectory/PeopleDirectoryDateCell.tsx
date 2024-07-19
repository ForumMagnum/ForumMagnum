import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import moment from "moment";
import { textCellStyles } from "./PeopleDirectoryTextCell";

const styles = (theme: ThemeType) => ({
  root: {
    ...textCellStyles(theme),
  },
});

const PeopleDirectoryDateCell = ({user, fieldName, format, classes}: {
  user: SearchUser,
  fieldName: keyof SearchUser,
  format: string,
  classes: ClassesType<typeof styles>,
}) => {
  const date = moment(String(user[fieldName]));
  return (
    <div className={classes.root}>
      {date.format(format)}
    </div>
  );
}

const PeopleDirectoryDateCellComponent = registerComponent(
  "PeopleDirectoryDateCell",
  PeopleDirectoryDateCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryDateCell: typeof PeopleDirectoryDateCellComponent
  }
}
