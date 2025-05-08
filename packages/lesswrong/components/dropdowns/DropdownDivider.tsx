import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { isFriendlyUI } from "../../themes/forumTheme";

const styles = (_theme: ThemeType) => ({
  root: {
    margin: isFriendlyUI ? `6px 0 !important` : undefined,
  },
});

const DropdownDividerInner = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { SimpleDivider } = Components;
  return (
    <SimpleDivider className={classNames(className, classes.root)} />
  );
}

export const DropdownDivider = registerComponent(
  "DropdownDivider",
  DropdownDividerInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    DropdownDivider: typeof DropdownDivider
  }
}
