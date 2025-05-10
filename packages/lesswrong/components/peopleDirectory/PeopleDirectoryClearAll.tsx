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

const PeopleDirectoryClearAllInner = ({text = "Clear all", onClear, classes}: {
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

export const PeopleDirectoryClearAll = registerComponent(
  "PeopleDirectoryClearAll",
  PeopleDirectoryClearAllInner,
  {styles},
);


