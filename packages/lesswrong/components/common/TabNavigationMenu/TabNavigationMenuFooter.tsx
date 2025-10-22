import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { AnalyticsContext } from "../../../lib/analyticsEvents";

// -- See here for all the tab content --
import getMenuTabs from './menuTabs'
import TabNavigationFooterItem from "./TabNavigationFooterItem";
import { useForumType } from '@/components/hooks/useForumType';

const styles = (theme: ThemeType) => ({
  wrapper: {
    [theme.breakpoints.up('lg')]: {
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
})

const TabNavigationMenuFooter = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const { forumSelect } = useForumType();

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

export default registerComponent(
  'TabNavigationMenuFooter', TabNavigationMenuFooter, {styles}
);


