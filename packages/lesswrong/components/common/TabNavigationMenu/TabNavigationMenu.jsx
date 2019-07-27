import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../withUser';
import { iconWidth } from './TabNavigationItem'

// -- See here for all the tab content --
import menuTabs from './menuTabs'

const styles = (theme) => {
  // console.log('theme breakpoints', theme.breakpoints.up('lg'))
  // console.log('theme.zIndex.tabNavigation', theme.zIndexes.tabNavigation)
  return {
    root: {
      display: "flex",
      justifyContent: "space-around",
      backgroundColor: "#ffffffd4",
    },
    // TODO; refactor to default theme
    hideOnMobile: {
      [theme.breakpoints.down('md')]: {
        display: "none"
      },
    },
    standaloneFlex: {
      [theme.breakpoints.up('lg')]: {
        flexDirection: "column",
      },
      [theme.breakpoints.down('md')]: {
        flexDirection: "row",
      }
    },
    drawerFlex: {
      flexDirection: "column",
    },
    divider: {
      width: 50,
      marginLeft: (theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2)) - 2,
      marginTop: theme.spacing.unit*1.5,
      marginBottom: theme.spacing.unit*2.5,
      borderBottom: "solid 1px rgba(0,0,0,.2)",
    },
  }
}

const TabNavigationMenu = ({classes, standalone, currentUser}) => {
  const { TabNavigationItem } = Components
  const customComponentProps = {currentUser}

  return (
    <div className={classNames(
        classes.root, {[classes.standaloneFlex]: standalone, [classes.drawerFlex]: !standalone}
    )}>
      {menuTabs[getSetting('forumType')].map(tab => {
        const mobileHide = {[classes.hideOnMobile]: standalone && !tab.showOnMobileStandalone}
        // console.log('tab', tab)
        if (tab.divider) {
          return <div
            key={tab.id}
            className={classNames(classes.divider, mobileHide)}
          />
        }
        if (tab.customComponent) {
          return <tab.customComponent
            key={tab.id}
            {...customComponentProps}
            className={classNames(mobileHide)}
          />
        }

        return <TabNavigationItem
          key={tab.id}
          tab={tab}
          standalone={standalone}
        />
      })}
      {/* TODO; better mobile behavior, include way to find faq */}
    </div>
  )
};

registerComponent(
  'TabNavigationMenu', TabNavigationMenu,
  withUser, withStyles(styles, { name: 'TabNavigationMenu'})
);
