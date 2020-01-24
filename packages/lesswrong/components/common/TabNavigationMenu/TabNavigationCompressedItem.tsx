import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles, createStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';

const compressedIconSize = 23

const styles = createStyles(theme => ({
  icon: {
    display: "block",
    opacity: .6,
    width: compressedIconSize,
    height: compressedIconSize,
    '& svg': {
      width: compressedIconSize,
      height: compressedIconSize,
    }
  },
  navText: {
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    fontSize: '.8rem',
  },
  homeIcon: {
    '& svg': {
      position: "relative",
      top: -1,
    }
  },
}))

const TabNavigationCompressedItem = ({tab, onClick, classes}) => {
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Case to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  return <Tooltip placement='right-start' title={tab.tooltip || ''}>
    <MenuItemUntyped
      onClick={onClick}
      component={Link} to={tab.link}
    >
      <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
        {tab.compressedIconComponent && <tab.compressedIconComponent />}
      </span>
    </MenuItemUntyped>
  </Tooltip>;
}

registerComponent(
  'TabNavigationCompressedItem', TabNavigationCompressedItem,
  withStyles(styles, { name: 'TabNavigationCompressedItem'})
);
