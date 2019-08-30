import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../../lib/reactRouterWrapper.js';
import { useLocation } from '../../../lib/routeUtil.js';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';

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
    backgroundColor: theme.palette.grey[400]
  },
  navButton: {
    paddingTop: theme.spacing.unit,
    paddingBottom: 2,
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
    opacity: .45,
    width: smallIconSize,
    height: smallIconSize,
    '& svg': {
      width: smallIconSize,
      height: smallIconSize,
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

const TabNavigationFooterItem = ({tab, classes}) => {
  const { TabNavigationSubItem } = Components
  const { pathname } = useLocation()

  return <Tooltip placement='right-start' title={tab.tooltip || ''}>
    <Link
      to={tab.link}
      className={classNames(classes.navButton, {[classes.selected]: pathname === tab.link})}
    >
      {(tab.icon || tab.iconComponent) && <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          { tab.mobileTitle || tab.title }
        </TabNavigationSubItem> :
        <span className={classes.navText}>
          { tab.mobileTitle || tab.title }
        </span>
      }
    </Link>
  </Tooltip>
}

registerComponent(
  'TabNavigationFooterItem', TabNavigationFooterItem,
  withStyles(styles, { name: 'TabNavigationFooterItem'})
);
