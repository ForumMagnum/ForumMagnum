import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from '../../../lib/reactRouterWrapper.js';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../../lib/reactRouterWrapper.js';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';

export const iconWidth = 30
const smallIconSize = 23

const styles = theme => ({
  selected: {
    '& $icon': {
      opacity: 1,
    },
    '& $navText': {
      color: theme.palette.grey[900],
      fontWeight: 600,
    },
    [theme.breakpoints.down('md')]: {
      backgroundColor: theme.palette.grey[400]
    }
  },
  navButton: {
    '&:hover': {
      opacity:.6
    },
    paddingTop: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  navButtonStandalone: {
    [theme.breakpoints.down('md')]: {
      justifyContent: "space-around",
      paddingTop: theme.spacing.unit,
      paddingBottom: 2,
      width: "100%",
      flexDirection: "column",
    }
  },
  hideOnMobile: {
    [theme.breakpoints.down('md')]: {
      display: "none"
    },
  },
  icon: {
    display: "block",
    opacity: .3,
    width: iconWidth,
    height: 28,
    marginRight: theme.spacing.unit*2,
    display: "inline",
  },
  iconStandalone: {
    [theme.breakpoints.down('md')]: {
      marginRight: 'unset',
      display: 'unset',
      opacity: .45,
      width: smallIconSize,
      height: smallIconSize,
      '& svg': {
        width: smallIconSize,
        height: smallIconSize,
      }
    }
  },
  navText: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    textTransform: "none !important",
  },
  navTextStandalone: {
    [theme.breakpoints.down('md')]: {
      textTransform: 'unset',
      fontSize: '.8rem',
      color: theme.palette.grey[700],
    },
  },
  homeIcon: {
    '& svg': {
      height: 29,
      position: "relative",
      top: -1,
      [theme.breakpoints.down('md')]: {
        height: smallIconSize,
        width: smallIconSize
      }
    }
  },
})

const TabNavigationItem = ({tab, classes, location, standalone}) => {
  const { TabNavigationSubItem } = Components
  const { pathname } = location

  return <Tooltip placement='right-start' title={tab.tooltip || ''}>
    <Link
      to={tab.link}
      className={classNames({
        [classes.navButton]: !tab.subItem,
        [classes.navButtonStandalone]: !tab.subItem && standalone,
        [classes.selected]: pathname === tab.link && standalone,
        [classes.hideOnMobile]: standalone && !tab.showOnMobileStandalone
      })}
    >
      {/* TODO; all icons take classname */}
      {(tab.icon || tab.iconComponent) && <span
        // TODO; homeIcon
        className={classNames(
          classes.icon, {[classes.homeIcon]: tab.id === 'home', [classes.iconStandalone]: standalone}
        )}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          {tab.title}
        </TabNavigationSubItem> :
        <span className={classNames(classes.navText, {[classes.navTextStandalone]: standalone})}>
          {tab.title}
        </span>
      }
    </Link>
  </Tooltip>
}

registerComponent(
  'TabNavigationItem', TabNavigationItem,
  withRouter, withStyles(styles, { name: 'TabNavigationItem'})
);
