import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { formatStat } from "../users/EAUserTooltipContent";
import { cellTextStyles } from "./PeopleDirectoryTextCell";

const styles = (theme: ThemeType) => ({
  root: {
    ...cellTextStyles(theme),
  },
});

export const PeopleDirectoryNumberCell = ({user, fieldName, classes}: {
  user: SearchUser,
  fieldName: keyof SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const value = Number(user[fieldName] ?? 0);
  return (
    <div className={classes.root}>
      {formatStat(value)}
    </div>
  );
}

const PeopleDirectoryNumberCellComponent = registerComponent(
  "PeopleDirectoryNumberCell",
  PeopleDirectoryNumberCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryNumberCell: typeof PeopleDirectoryNumberCellComponent
  }
}