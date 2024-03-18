import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { MultiSelectState } from "../hooks/useMultiSelect";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    userSelect: "none",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  check: {
    display: "inline",
    border: `1px solid ${theme.palette.grey[340]}`,
    borderRadius: theme.borderRadius.small,
    width: 16,
    height: 16,
  },
  selected: {
    background: theme.palette.primary.dark,
  },
  icon: {
    width: 16,
    height: 16,
    marginLeft: -1,
  },
});

export const PeopleDirectorySelectOption = ({state, classes}: {
  state: MultiSelectState,
  classes: ClassesType<typeof styles>,
}) => {
  const {label, selected, onToggle} = state;
  const {ForumIcon} = Components;
  return (
    <div onClick={onToggle} className={classes.root}>
      <div className={classNames(classes.check, {[classes.selected]: selected})}>
        {selected && <ForumIcon icon="Check" className={classes.icon} />}
      </div>
      {label}
    </div>
  );
}

const PeopleDirectorySelectOptionComponent = registerComponent(
  "PeopleDirectorySelectOption",
  PeopleDirectorySelectOption,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySelectOption: typeof PeopleDirectorySelectOptionComponent
  }
}
