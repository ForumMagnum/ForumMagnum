import React from 'react';
import classNames from 'classnames';
import type { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface ListItemIconProps extends StandardProps<{}, ListItemIconClassKey> {
  children: React.ReactElement<any>;
}

export type ListItemIconClassKey = 'root';

export const styles = defineStyles("MuiListItemIcon", theme => ({
  /* Styles applied to the root element. */
  root: {
    marginRight: 16,
    color: theme.palette.action.active,
    flexShrink: 0,
  },
}), {stylePriority: -10});

/**
 * A simple wrapper to apply `List` styles to an `Icon` or `SvgIcon`.
 */
function ListItemIcon(props: ListItemIconProps) {
  const { children, classes: classesOverride, className: classNameProp, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return React.cloneElement(children, {
    className: classNames(classes.root, classNameProp, children.props.className),
    ...other,
  });
}

export default ListItemIcon;
