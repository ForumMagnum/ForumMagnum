import React, { ReactNode } from "react";
import classNames from "classnames";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("DropdownMenu", (theme: ThemeType) => ({
  root: {
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
