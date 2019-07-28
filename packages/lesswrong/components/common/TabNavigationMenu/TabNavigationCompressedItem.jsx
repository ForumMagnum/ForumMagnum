import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../../lib/reactRouterWrapper.js';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';

const compressedIconSize = 23

const styles = theme => ({
  navButton: {
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
  },
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
})

const TabNavigationCompressedItem = ({tab, classes}) => {
  const { TabNavigationSubItem } = Components

  return <Tooltip placement='right-start' title={tab.tooltip || ''}>
    <Link
      to={tab.link}
      className={classes.navButton}
    >
      {/* TODO; all icons take classname */}
      {<span
        // TODO; homeIcon
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
        {tab.compressedIconComponent && <tab.compressedIconComponent />}
      </span>}
    </Link>
  </Tooltip>
}

registerComponent(
  'TabNavigationCompressedItem', TabNavigationCompressedItem,
  withStyles(styles, { name: 'TabNavigationCompressedItem'})
);
