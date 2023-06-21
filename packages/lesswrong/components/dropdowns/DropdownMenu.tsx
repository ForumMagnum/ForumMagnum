import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";
import { isEAForum } from "../../lib/instanceSettings";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...(isEAForum && {
      padding: 6,
      borderRadius: theme.borderRadius.default,
      backgroundColor: theme.palette.dropdown.background,
      border: `1px solid ${theme.palette.dropdown.border}`,
    }),
  },
});

const DropdownMenu = ({children, className, classes}: {
  children: ReactNode,
  className?: string,
  classes: ClassesType,
}) => {
  return (
    <div className={classNames(classes.root, className)}>
      {children}
    </div>
  );
}

const DropdownMenuComponent = registerComponent(
  "DropdownMenu",
  DropdownMenu,
  {styles},
);

declare global {
  interface ComponentTypes {
    DropdownMenu: typeof DropdownMenuComponent
  }
}
