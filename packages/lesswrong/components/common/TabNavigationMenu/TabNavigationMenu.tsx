import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { useCurrentUserId } from '../withUser';
import TabNavigationItem, { iconWidth } from './TabNavigationItem'

// -- See here for all the tab content --
import getMenuTabs from './menuTabs'
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { forumSelect } from '../../../lib/forumTypeUtils';
import classNames from 'classnames';
import EventsList from './EventsList';
import { SubscribeWidget } from '../SubscribeWidget';

export const TAB_NAVIGATION_MENU_WIDTH = 250
export const TAB_NAVIGATION_MENU_ICON_ONLY_WIDTH = 64

const styles = (theme: ThemeType) => {
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      maxWidth: TAB_NAVIGATION_MENU_WIDTH,
      paddingTop: 15,
      ...(theme.isFriendlyUI
        ? {
          paddingLeft: 6,
          height: "100%",
        }
        : {
          justifyContent: "space-around",
        }),
    },
    noTopMargin: {
      paddingTop: "0px !important",
    },
    iconOnlyRoot: {
      maxWidth: TAB_NAVIGATION_MENU_ICON_ONLY_WIDTH,
      width: TAB_NAVIGATION_MENU_ICON_ONLY_WIDTH,
      paddingLeft: 0,
      paddingRight: 0,
      justifyContent: "flex-start",
      alignItems: "center",
    },
    navSidebarTransparent: {
      zIndex: 10,
      background: theme.palette.panelBackground.bannerAdTranslucent,
      backdropFilter: theme.palette.filters.bannerAdBlurMedium
    },
    divider: {
      width: 50,
      borderBottom: theme.palette.border.normal,
      ...(theme.isBookUI && theme.dark && {
        color: theme.palette.text.bannerAdOverlay,
        background: theme.palette.text.bannerAdOverlay,
      }),
      marginBottom: theme.spacing.unit * 2.5,
      ...(theme.isFriendlyUI
        ? {
          marginLeft: theme.spacing.unit * 2.5,
          marginTop: theme.spacing.unit * 2.5,
        }
        : {
          marginLeft: (theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2)) - 2,
          marginTop: theme.spacing.unit * 1.5,
        }),
    },
  }
}

type TabNavigationMenuProps = {
  onClickSection?: (e?: React.BaseSyntheticEvent) => void,
  transparentBackground?: boolean,
  noTopMargin?: boolean,
  iconOnlyNavigationEnabled?: boolean,
  classes: ClassesType<typeof styles>,
}

const TabNavigationMenu = ({
  onClickSection,
  transparentBackground,
  noTopMargin,
  iconOnlyNavigationEnabled,
  classes,
}: TabNavigationMenuProps) => {
  const currentUserId = useCurrentUserId();
  const { captureEvent } = useTracking()
  const iconOnly = !!iconOnlyNavigationEnabled;
  const handleClick = (e: React.BaseSyntheticEvent, tabId: string) => {
    captureEvent(`${tabId}NavClicked`)
    onClickSection && onClickSection(e)
  }

  const tabs = forumSelect(getMenuTabs());
  const filteredTabs = iconOnly
    ? tabs.filter(tab => {
      if ('customComponentName' in tab) return false
      if ('divider' in tab) return false
      if ('icon' in tab && tab.icon) return true
      if ('iconComponent' in tab && tab.iconComponent) return true
      if ('compressedIconComponent' in tab && tab.compressedIconComponent) return true
      return false
    })
    : tabs

  return (
      <AnalyticsContext pageSectionContext="navigationMenu">
        <div className={classNames(classes.root, {
          [classes.iconOnlyRoot]: iconOnly,
          [classes.navSidebarTransparent]: transparentBackground,
          [classes.noTopMargin]: noTopMargin,
        })}>
          {filteredTabs.map(tab => {
            if ('loggedOutOnly' in tab && tab.loggedOutOnly && currentUserId) return null

            if ('divider' in tab) {
              return <div key={tab.id} className={classes.divider} />
            }
            if ('customComponentName' in tab) {
              switch (tab.customComponentName) {
                case 'EventsList':
                  return <EventsList
                    key={tab.id}
                    onClick={(e: React.BaseSyntheticEvent) => handleClick(e, tab.id)}
                  />;
                case 'SubscribeWidget':
                  return <SubscribeWidget key={tab.id} />;
              }
            }

            return <TabNavigationItem
              key={tab.id}
              tab={tab}
              onClick={(e) => handleClick(e, tab.id)}
              iconOnlyNavigationEnabled={iconOnly}
            />
          })}
          {/* NB: This returns null if you don't have any active resources */}
          {/* <FeaturedResourceBanner terms={{view: "activeResources"}}/> */}
        </div>
    </AnalyticsContext>  )
};

export default registerComponent<TabNavigationMenuProps>(
  'TabNavigationMenu', TabNavigationMenu, {styles}
);


