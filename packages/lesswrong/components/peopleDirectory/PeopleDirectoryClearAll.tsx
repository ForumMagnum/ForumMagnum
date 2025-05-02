import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
    display: "inline-block",
    cursor: "pointer",
    userSelect: "none",
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.primary.dark,
  },
});

const PeopleDirectoryClearAll = ({text = "Clear all", onClear, classes}: {
  text?: string,
  onClear: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div onClick={onClear} className={classes.root}>
      {text}
    </div>
  );
}

const PeopleDirectoryClearAllComponent = registerComponent(
  "PeopleDirectoryClearAll",
  PeopleDirectoryClearAll,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryClearAll: typeof PeopleDirectoryClearAllComponent
  }
}
