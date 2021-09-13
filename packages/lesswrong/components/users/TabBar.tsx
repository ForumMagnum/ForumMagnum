import React, {useEffect, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import classNames from 'classnames';
import Drawer from '@material-ui/core/Drawer';
import MenuItem from '@material-ui/core/MenuItem';
import * as _ from 'underscore';

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
  const { history } = useNavigation();
  const { location } = useLocation();
  const { hash } = location;
  const [smallScreenMode, setSmallScreenMode] = useState(false);
  const hashIsValidTab = _.any(tabs, tab=>tab.name===hash);
  
  useEffect(() => {
    const windowIsNarrow = window && window.innerWidth<600;
    if (smallScreenMode != windowIsNarrow)
      setSmallScreenMode(windowIsNarrow);
    if (smallScreenMode && hash && currentTab!==hash && hashIsValidTab) {
      setCurrentTab(hash);
    }
  }, [smallScreenMode, hash, currentTab, setCurrentTab, hashIsValidTab]);
  
  return <div>
    <Drawer
      variant="persistent"
      anchor="left"
      open={!smallScreenMode || !hash}
    >
      <div className={classes.tabsDrawer}>
        {tabs.map(tab => <MenuItem
          key={tab.name}
          onClick={ev => {
            if (smallScreenMode) {
              history.push({...location, hash: tab.name});
            }
            setCurrentTab(tab.name)
          }}
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
