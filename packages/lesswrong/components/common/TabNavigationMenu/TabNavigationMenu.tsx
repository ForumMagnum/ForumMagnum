import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import { useCurrentUser } from '../withUser';
import { iconWidth } from './TabNavigationItem'

// -- See here for all the tab content --
import menuTabs from './menuTabs'
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { forumSelect } from '../../../lib/forumTypeUtils';

export const TAB_NAVIGATION_MENU_WIDTH = 250

const styles = (theme: ThemeType): JssStyles => {
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",
      maxWidth: TAB_NAVIGATION_MENU_WIDTH,
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

const TabNavigationMenu = ({onClickSection, classes}: {
  onClickSection?: any,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { TabNavigationItem, FeaturedResourceBanner } = Components
  const customComponentProps = {currentUser}
  
  const handleClick = (e, tabId) => {
    captureEvent(`${tabId}NavClicked`)
    onClickSection && onClickSection(e)
  }

  return (
      <AnalyticsContext pageSectionContext="navigationMenu">
        <div className={classes.root}>
          {forumSelect(menuTabs).map(tab => {
            if ('loggedOutOnly' in tab && tab.loggedOutOnly && currentUser) return null
            
            if ('divider' in tab) {
              return <div key={tab.id} className={classes.divider} />
            }
            if ('customComponentName' in tab) {
              const CustomComponent = Components[tab.customComponentName];
              return <CustomComponent
                key={tab.id}
                onClick={(e) => handleClick(e, tab.id)}
                {...customComponentProps}
              />
            }

            return <TabNavigationItem
              key={tab.id}
              tab={tab}
              onClick={(e) => handleClick(e, tab.id)}
            />
          })}
          {/* NB: This returns null if you don't have any active resources */}
          <FeaturedResourceBanner terms={{view: "activeResources"}}/>
        </div>
    </AnalyticsContext>  )
};

const TabNavigationMenuComponent = registerComponent(
  'TabNavigationMenu', TabNavigationMenu, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationMenu: typeof TabNavigationMenuComponent
  }
}
