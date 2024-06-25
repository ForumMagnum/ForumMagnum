import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    display: "flex",
    gap: "10px",
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
  iconNotSelected: {
    opacity: 0,
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
      <ForumIcon icon="Check" className={classNames(
        classes.icon,
        !selected && classes.iconNotSelected,
      )} />
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
