import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { isFriendlyUI } from "../../themes/forumTheme";
import SimpleDivider from "../widgets/SimpleDivider";

const styles = (_theme: ThemeType) => ({
  root: {
    margin: isFriendlyUI ? `6px 0 !important` : undefined,
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


