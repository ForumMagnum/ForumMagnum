import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper.js';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import { useLocation } from '../../../lib/routeUtil.js';

export const iconWidth = 30

const styles = theme => ({
  selected: {
    '& $icon': {
      opacity: 1,
    },
    '& $navText': {
      color: theme.palette.grey[900],
      fontWeight: 600,
    },
  },
  navButton: {
    '&:hover': {
      opacity:.6,
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    },
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  subItemOverride: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    }
  },
  icon: {
    opacity: .3,
    width: iconWidth,
    height: 28,
    marginRight: theme.spacing.unit*2,
    display: "inline",
  },
  navText: {
    ...theme.typography.body1,
    color: theme.palette.grey[600],
    textTransform: "none !important",
  },
  homeIcon: {
    '& svg': {
      height: 29,
      position: "relative",
      top: -1,
    }
  },
})

const TabNavigationItem = ({tab, onClick, classes}) => {
  const { TabNavigationSubItem } = Components
  const { pathname } = useLocation()

  return <Tooltip placement='right-start' title={tab.tooltip || ''}>
    <MenuItem
      onClick={onClick}
      component={Link} to={tab.link}
      disableGutters
      classes={{root: classNames({
        [classes.navButton]: !tab.subItem,
        [classes.subItemOverride]: tab.subItem,
        [classes.selected]: pathname === tab.link,
      })}}
      disableTouchRipple
    >
      {(tab.icon || tab.iconComponent) && <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          {tab.title}
        </TabNavigationSubItem> :
        <span className={classes.navText}>
          {tab.title}
        </span>
      }
    </MenuItem>
  </Tooltip>
}

registerComponent(
  'TabNavigationItem', TabNavigationItem,
  withStyles(styles, { name: 'TabNavigationItem'})
);
