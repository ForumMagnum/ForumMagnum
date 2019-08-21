import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../withUser';
import { iconWidth } from './TabNavigationItem'

// -- See here for all the tab content --
import menuTabs from './menuTabs'

const styles = (theme) => {
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",
      maxWidth: 260,
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

const TabNavigationMenu = ({onClickSection, classes, currentUser}) => {
  const { TabNavigationItem } = Components
  const customComponentProps = {currentUser}

  return (
    <div className={classes.root}>
      {menuTabs[getSetting('forumType')].map(tab => {
        if (tab.divider) {
          return <div key={tab.id} className={classes.divider} />
        }
        if (tab.customComponent) {
          return <tab.customComponent
            key={tab.id}
            onClick={onClickSection}
            {...customComponentProps}
          />
        }

        return <TabNavigationItem
          key={tab.id}
          tab={tab}
          onClick={onClickSection}
        />
      })}
    </div>
  )
};

registerComponent(
  'TabNavigationMenu', TabNavigationMenu,
  withUser, withStyles(styles, { name: 'TabNavigationMenu'})
);
