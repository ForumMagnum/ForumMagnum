import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";

const styles = (_theme: ThemeType): JssStyles => ({
  root: {
  },
});

const DropdownMenu = ({children, className, classes}: {
  children: ReactNode,
  className?: string,
  classes: ClassesType,
}) => {
  return (
    <div className={classNames(classes.root, className)} >
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
