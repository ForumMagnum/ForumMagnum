import React from 'react';
import classNames from 'classnames';
import { cloneChildrenWithClassName } from '@/lib/vendor/@material-ui/core/src/utils/reactHelpers';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("DialogActions", (theme) => ({
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: '0 0 auto',
    margin: '8px 4px',
  },
  /* Styles applied to the children. */
  action: {
    margin: '0 4px',
  },
}));

export function DialogActions(props: {
  className?: string
  disableActionSpacing?: boolean;
  children?: React.ReactNode
}) {
  const { disableActionSpacing=false, children, className } = props;
  const classes = useStyles(styles);

  return (
    <div className={classNames(classes.root, className)}>
      {disableActionSpacing ? children : cloneChildrenWithClassName(children, classes.action)}
    </div>
  );
}
