import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    display: "flex",
  },
  label: {
    flexGrow: 1,
    fontSize: 14,
    fontWeight: 500,
  },
  icon: {
    width: 16,
    height: 16,
    color: theme.palette.primary.main,
  },
});

const PeopleDirectoryCheckOption = ({label, selected, onSelect, classes}: {
  label: string,
  selected: boolean,
  onSelect?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const {ForumIcon} = Components;
  return (
    <div onClick={onSelect} className={classes.root}>
      <div className={classes.label}>{label}</div>
      {selected && <ForumIcon icon="Check" className={classes.icon} />}
    </div>
  );
}

const PeopleDirectoryCheckOptionComponent = registerComponent(
  "PeopleDirectoryCheckOption",
  PeopleDirectoryCheckOption,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryCheckOption: typeof PeopleDirectoryCheckOptionComponent
  }
}
