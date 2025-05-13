import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Typography } from "../common/Typography";

export const styles = defineStyles("DialogTitle", theme => ({
  /* Styles applied to the root element. */
  root: {
    margin: 0,
    padding: '24px 24px 20px',
    flex: '0 0 auto',
  },
}), {stylePriority: -1});

export function DialogTitle(props: {
  className?: string,
  disableTypography?: boolean,
  children: React.ReactNode,
}) {
  const { children, className, disableTypography=false } = props;
  const classes = useStyles(styles);
  return (
    <div className={classNames(classes.root, className)}>
      {disableTypography ? children : <Typography variant="title">{children}</Typography>}
    </div>
  );
}
