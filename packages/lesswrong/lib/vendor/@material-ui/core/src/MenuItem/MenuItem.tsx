// @inheritedComponent ListItem

import React from 'react';
import classNames from 'classnames';
import ListItem from '../ListItem';
import { StandardProps } from '..';
import { ListItemProps } from '../ListItem/ListItem';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface MenuItemProps extends StandardProps<ListItemProps, MenuItemClassKey> {
  component?: React.ComponentType<MenuItemProps>;
  role?: string;
}

export type MenuItemClassKey = 'root' | 'selected';

export const styles = defineStyles("MuiMenuItem", theme => ({
  /* Styles applied to the root element. */
  root: {
    ...theme.typography.subheading,
    height: 24,
    boxSizing: 'content-box',
    width: 'auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingLeft: 16,
    paddingRight: 16,
    '&$selected': {},
  },
  /* Styles applied to the root element if `selected={true}`. */
  selected: {},
}), {stylePriority: -10});

function MenuItem(props: MenuItemProps) {
  const { classes: classesOverride, className, component, selected, role, ...other } = props;
  const classes = useStyles(styles, classesOverride);

  return (
    <ListItem
      button
      role={role}
      tabIndex={-1}
      selected={selected}
      className={classNames(classes.root, { [classes.selected]: selected }, className)}
      component={component}
      {...other}
    />
  );
}

MenuItem.defaultProps = {
  component: 'li',
  role: 'menuitem',
};

export default MenuItem;
