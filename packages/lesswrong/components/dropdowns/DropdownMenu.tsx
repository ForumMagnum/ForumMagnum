import React, { ReactNode } from "react";
import classNames from "classnames";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("DropdownMenu", (theme: ThemeType) => ({
  root: {
    ...(theme.isFriendlyUI && {
      padding: 6,
      borderRadius: theme.borderRadius.default,
      backgroundColor: theme.palette.dropdown.background,
      border: `1px solid ${theme.palette.dropdown.border}`,
    }),
  },
}));

const DropdownMenu = ({children, className}: {
  children: ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classNames(classes.root, className)}>
      {children}
    </div>
  );
}

export default DropdownMenu;
