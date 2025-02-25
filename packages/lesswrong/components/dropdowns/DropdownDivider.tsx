import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import Divider from "@material-ui/core/Divider";
import classNames from "classnames";
import { isFriendlyUI } from "../../themes/forumTheme";

const styles = (_theme: ThemeType) => ({
  root: {
    margin: isFriendlyUI ? `6px 0` : undefined,
  },
});

const DropdownDivider = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <Divider className={classNames(className, classes.root)} />
  );
}

const DropdownDividerComponent = registerComponent(
  "DropdownDivider",
  DropdownDivider,
  {styles},
);

declare global {
  interface ComponentTypes {
    DropdownDivider: typeof DropdownDividerComponent
  }
}
