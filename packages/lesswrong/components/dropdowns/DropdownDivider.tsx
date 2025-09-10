import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import SimpleDivider from "../widgets/SimpleDivider";

const styles = (theme: ThemeType) => ({
  root: {
    margin: theme.isFriendlyUI ? `6px 0 !important` : undefined,
  },
});

const DropdownDivider = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <SimpleDivider className={classNames(className, classes.root)} />
  );
}

export default registerComponent(
  "DropdownDivider",
  DropdownDivider,
  {styles},
);


