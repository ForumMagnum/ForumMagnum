import React from 'react';
import classNames from 'classnames';
import type { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface ListItemSecondaryActionProps
  extends StandardProps<{}, ListItemSecondaryActionClassKey> {
  children?: React.ReactNode
}

export type ListItemSecondaryActionClassKey = 'root';

export const styles = defineStyles("MuiListItemSecondaryAction", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'absolute',
    right: 4,
    top: '50%',
    transform: 'translateY(-50%)',
  },
}), {stylePriority: -10});

function ListItemSecondaryAction(props: ListItemSecondaryActionProps) {
  const { children, classes: classesOverride, className, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <div className={classNames(classes.root, className)} {...other}>
      {children}
    </div>
  );
}

ListItemSecondaryAction.muiName = 'ListItemSecondaryAction';

export default ListItemSecondaryAction;
