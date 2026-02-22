"use client";

import { Ref, useCallback, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { getSortOrderOptions } from '../../lib/collections/posts/dropdownOptions';
import { MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { preferredHeadingCase } from '../../themes/forumTheme';
import DeferRender from '../common/DeferRender';
import { TooltipRef } from '../common/FMTooltip';
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import SettingsButton from "../icons/SettingsButton";
import AllPostsList from "./AllPostsList";
import PostsListSettings from "./PostsListSettings";

const styles = (theme: ThemeType) => ({
  title: {
    cursor: "pointer",
    "& .SectionTitle-title": {},
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
});

const formatSort = (sorting: PostSortingMode) => {
  const sort = getSortOrderOptions()[sorting].label
  return `Sorted by ${sort}`;
}

const AllPostsPage = ({classes, defaultHideSettings}: {classes: ClassesType<typeof styles>, defaultHideSettings?: boolean}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {query} = useLocation();
  const {captureEvent} = useTracking();

  const [showSettings, setShowSettings] = useState<boolean>(defaultHideSettings ? false : !!currentUser?.allPostsOpenSettings);

  const toggleSettings = useCallback(() => {
    const newValue = !showSettings;
    setShowSettings(newValue);
    captureEvent("toggleSettings", {
      action: newValue,
      listContext: "allPostsPage",
    });
    if (currentUser) {
      void updateCurrentUser({
        allPostsOpenSettings: newValue,
      });
    }
  }, [showSettings, captureEvent, currentUser, updateCurrentUser]);

  const currentTimeframe = query.timeframe || currentUser?.allPostsTimeframe || 'daily';
  const currentSorting = (query.sortedBy   || currentUser?.allPostsSorting   || 'magic') as PostSortingMode;
  const currentFilter = query.filter       || currentUser?.allPostsFilter    || 'all';
  const currentShowLowKarma = (parseInt(query.karmaThreshold) === MAX_LOW_KARMA_THRESHOLD) ||
      !!currentUser?.allPostsShowLowKarma;
  const currentIncludeEvents = (query.includeEvents === 'true') || !!currentUser?.allPostsIncludeEvents;
  const currentHideCommunity = (query.hideCommunity === 'true') || !!currentUser?.allPostsHideCommunity;
  return (
    <>
      <AnalyticsContext pageContext="allPostsPage">
        <SingleColumnSection>
        <DeferRender ssr={false}>
          <TooltipRef
            title={`${showSettings ? "Hide": "Show"} options for sorting and filtering`}
            placement="top-end"
          >
            {(ref: Ref<HTMLDivElement>) => <div ref={ref} className={classes.title} onClick={toggleSettings}>
              <SectionTitle title={preferredHeadingCase("All Posts")}>
                {<SettingsButton label={`Sorted by ${ getSortOrderOptions()[currentSorting].label }`}/>
                }
              </SectionTitle>
            </div>}
          </TooltipRef>
          {false}
          <PostsListSettings
            hidden={!showSettings}
            currentTimeframe={currentTimeframe}
            currentSorting={currentSorting}
            currentFilter={currentFilter}
            currentShowLowKarma={currentShowLowKarma}
            currentIncludeEvents={currentIncludeEvents}
            currentHideCommunity={currentHideCommunity}
            persistentSettings
            showTimeframe
          />
          <AllPostsList
            {...{
              currentTimeframe,
              currentSorting,
              currentFilter,
              currentShowLowKarma,
              currentIncludeEvents,
              currentHideCommunity,
              showSettings,
            }}
          />
        </DeferRender>
        </SingleColumnSection>
      </AnalyticsContext>
    </>
  );
}

export default registerComponent(
  "AllPostsPage",
  AllPostsPage,
  {styles},
);


