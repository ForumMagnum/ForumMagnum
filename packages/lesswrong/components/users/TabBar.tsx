import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import Drawer from '@material-ui/core/Drawer';
import MenuItem from '@material-ui/core/MenuItem';

const styles = (theme: ThemeType): JssStyles => ({
  tabDrawerRoot: {
  },
  tabsDrawer: {
    marginTop: 64,
  },
  tabBar: {
  },
  tab: {
  },
  selectedTab: {
  },
  tabbedContents: {
  },
});

const TabBar = ({currentTab, setCurrentTab, tabs, children, classes}: {
  currentTab: string,
  setCurrentTab: (tab: string)=>void,
  tabs: Array<{name: string, label: string}>,
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  return <div>
    <Drawer
      variant="persistent"
      anchor="left"
      open={true}
    >
      <div className={classes.tabsDrawer}>
        {tabs.map(tab => <MenuItem
          key={tab.name}
          onClick={ev => setCurrentTab(tab.name)}
          selected={tab.name===currentTab}
        >
          {tab.label}
        </MenuItem>)}
      </div>
    </Drawer>
    <div className={classes.tabbedContents}>
      {children}
    </div>
  </div>
}

const TabBarComponent = registerComponent('TabBar', TabBar, {styles});

declare global {
  interface ComponentTypes {
    TabBar: typeof TabBarComponent
  }
}
