import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import ForumIcon from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    display: "flex",
    gap: "10px",
    padding: "8px 16px",
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[50],
    },
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

export default registerComponent(
  "PeopleDirectoryCheckOption",
  PeopleDirectoryCheckOption,
  {styles},
);


