import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper.js';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';

const compressedIconSize = 23

const styles = theme => ({
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
    ...theme.typography.body1,
    color: theme.palette.grey[700],
    fontSize: '.8rem',
  },
  homeIcon: {
    '& svg': {
      position: "relative",
      top: -1,
    }
  },
})

const TabNavigationCompressedItem = ({tab, onClick, classes}) =>
  <Tooltip placement='right-start' title={tab.tooltip || ''}>
    <MenuItem
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
    </MenuItem>
  </Tooltip>


registerComponent(
  'TabNavigationCompressedItem', TabNavigationCompressedItem,
  withStyles(styles, { name: 'TabNavigationCompressedItem'})
);
