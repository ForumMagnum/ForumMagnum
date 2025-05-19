import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import { isFriendlyUI } from "../../themes/forumTheme";

const styles = (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI && {
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
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classNames(classes.root, className)}>
      {children}
    </div>
  );
}

export default registerComponent(
  "DropdownMenu",
  DropdownMenu,
  {styles},
);


