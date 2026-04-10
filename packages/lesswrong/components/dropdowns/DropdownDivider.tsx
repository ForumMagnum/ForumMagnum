import React from "react";
import classNames from "classnames";
import SimpleDivider from "../widgets/SimpleDivider";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("DropdownDivider", (theme: ThemeType) => ({
  root: {
  },
}));

const DropdownDivider = ({className}: {
  className?: string,
}) => {
  const classes = useStyles(styles);

  return (
    <SimpleDivider className={classNames(className, classes.root)} />
  );
}

export default DropdownDivider;
