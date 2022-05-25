import React, {useEffect, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSubscribedLocation, useNavigation } from '../../lib/routeUtil';
import classNames from 'classnames';
import Drawer from '@material-ui/core/Drawer';
import MenuItem from '@material-ui/core/MenuItem';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  tabDrawerRoot: {
  },
  tabsDrawer: {
    width: 200,
    marginTop: 75,
  },
  tabBar: {
  },
  tab: {
  },
  selectedTab: {
  },
  tabbedContentsWrapper: {
    marginLeft: 220, //Must be >= width of the tabsDrawer to not overlap
    paddingTop: 10,
    marginRight: 16,
  },
  tabbedContents: {
    margin: "0 auto",
    maxWidth: 600,
  },
  fullScreenSectionSelectTitle: {
    margin: 0,
    padding: 16,
  },
  tabsFullScreen: {
  },
  fullScreenLayout: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    minHeight: "100%",
    zIndex: 10000,
    background: theme.palette.panelBackground.default,
  },
  fullScreenContents: {
    padding: 8,
  },
});

// A drill-down menu, with sections (tabs) given as options on the left, and a
// main section on the right. If the screen is narrow (<600px), then instead
// of showing both at once, it will statefully switch between showing only the
// list of sections, and showing the contents.
//
// currentTab is either the name of the selected tab, or null. If null and in
// small screen mode, this corresponds to being in the top menu. If null and
// *not* in small scren mode, will immediately call setCurrentTab to pick the
// first tab in the tabs list.
//
// 
const TabBar = ({currentTab, setCurrentTab, smallScreenHeading, tabs, children, classes}: {
  currentTab: string|null,
  setCurrentTab: (tab: string|null)=>void,
  smallScreenHeading: string,
  tabs: Array<{name: string, label: string}>,
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  const { history } = useNavigation();
  const { location } = useSubscribedLocation();
  let { hash } = location;
  if (hash.startsWith("#"))
    hash = hash.substr(1);
  const [smallScreenMode, setSmallScreenMode] = useState(false);
  const { Typography } = Components;
  const hashIsValidTab = _.any(tabs, tab=>tab.name===hash);
  const selectedTab = currentTab ? _.find(tabs, tab=>tab.name==currentTab) : null;
  
  useEffect(() => {
    const windowIsNarrow = window && window.innerWidth<600;
    const defaultTab = tabs[0].name;
    
    if (smallScreenMode != windowIsNarrow) {
      setSmallScreenMode(windowIsNarrow);
    }
    
    // Keep the hash attached to the URL, and the state of what's visible, in
    // sync. This behaves differently depending whether you're using small
    // screen mode (ie a phone) or not, and is kind of hacky. The main reason
    // for this is to capture the back button.
    if (windowIsNarrow) {
      if (currentTab && !hash)
        setCurrentTab(null);
    } else {
      if (!currentTab) {
        setCurrentTab(defaultTab);
      }
      else if ((!hash || hashIsValidTab) && currentTab!==hash) {
        history.replace({...location, hash: currentTab});
      }
    }
    
  }, [smallScreenMode, hash, currentTab, setCurrentTab, hashIsValidTab, history, location, tabs]);
  
  const tabsMenuItems = tabs.map(tab => <MenuItem
    key={tab.name}
    selected={currentTab===tab.name}
    onClick={ev => {
      if (smallScreenMode) {
        history.push({...location, hash: tab.name});
      }
      setCurrentTab(tab.name)
    }}
  >
    {tab.label}
  </MenuItem>)
  
  if (smallScreenMode) {
    if (currentTab) {
      return <div className={classes.fullScreenLayout}>
        <Components.HeaderWithBackButton
          label={selectedTab?.label || ""}
          onBack={() => {
            history.push({...location, hash: null});
            setCurrentTab(null);
          }}
        />
        <div className={classes.fullScreenContents}>
          {children}
        </div>
      </div>
    } else {
      return <div className={classes.tabsFullScreen}>
        <Typography variant="display1" className={classes.fullScreenSectionSelectTitle}>{smallScreenHeading}</Typography>
        {tabsMenuItems}
      </div>
    }
  } else {
    return <div>
      <Drawer
        variant="persistent"
        anchor="left"
        open={!smallScreenMode || !hash}
      >
        <div className={classes.tabsDrawer}>
          {tabsMenuItems}
        </div>
      </Drawer>
      <div className={classes.tabbedContentsWrapper}>
      <div className={classes.tabbedContents}>
        {children}
      </div>
      </div>
    </div>
  }
}

const TabBarComponent = registerComponent('TabBar', TabBar, {styles});

declare global {
  interface ComponentTypes {
    TabBar: typeof TabBarComponent
  }
}
