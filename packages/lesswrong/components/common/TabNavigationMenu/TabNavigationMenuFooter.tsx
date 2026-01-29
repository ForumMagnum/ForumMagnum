import React from 'react';
import { AnalyticsContext } from "../../../lib/analyticsEvents";

// -- See here for all the tab content --
import getMenuTabs from './menuTabs'
import { forumSelect } from '../../../lib/forumTypeUtils';
import TabNavigationFooterItem from "./TabNavigationFooterItem";
import { ICON_ONLY_NAVIGATION_BREAKPOINT } from './NavigationStandalone';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TabNavigationMenuFooter", (theme: ThemeType) => ({
  wrapper: {
    [theme.breakpoints.up(ICON_ONLY_NAVIGATION_BREAKPOINT)]: {
      display: "none"
    },
    "@media print": {
      display: "none"
    },
    position: "fixed",
    bottom: 0,
    left: 0,
    backgroundColor: theme.palette.grey[300],
    width: "100%",
    zIndex: theme.zIndexes.footerNav,
  },
  root: {
    display: "flex",
    justifyContent: "space-around",
    backgroundColor: theme.palette.panelBackground.mobileNavFooter,
    flexDirection: "row",
  }
}))

const TabNavigationMenuFooter = () => {
  const classes = useStyles(styles);
  return (
    <div className={classes.wrapper}>
      <AnalyticsContext pageSectionContext="tabNavigationFooter">
        <div className={classes.root}>
          {forumSelect(getMenuTabs()).map(tab => {
            if (!('showOnMobileStandalone' in tab) || !tab.showOnMobileStandalone) {
              return
            }
            // NB: No support for custom components or dividers on footer
            return <TabNavigationFooterItem
              key={tab.id}
              tab={tab}
            />
          })}
        </div>
      </AnalyticsContext>
    </div>
  )
};

export default TabNavigationMenuFooter;


