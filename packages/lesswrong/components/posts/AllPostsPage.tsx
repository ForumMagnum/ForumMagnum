import React, { Ref, useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import { MAX_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { SORT_ORDER_OPTIONS } from '../../lib/collections/posts/dropdownOptions';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import DeferRender from '../common/DeferRender';
import { TooltipRef, TooltipSpan } from '../common/FMTooltip';

const styles = (theme: ThemeType) => ({
  title: {
    cursor: "pointer",
    "& .SectionTitle-title": isFriendlyUI
      ? {
        color: theme.palette.grey[1000],
        textTransform: "none",
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "0",
        lineHeight: "34px",
      }
      : {},
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
});

const description = `All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`;

const formatSort = (sorting: PostSortingMode) => {
  const sort = SORT_ORDER_OPTIONS[sorting].label
  return isFriendlyUI ? sort : `Sorted by ${sort}`;
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
    currentUser?.allPostsShowLowKarma || false;
  const currentIncludeEvents = (query.includeEvents === 'true') || currentUser?.allPostsIncludeEvents || false;
  const currentHideCommunity = (query.hideCommunity === 'true') || currentUser?.allPostsHideCommunity || false;

  const {
    SingleColumnSection, SectionTitle, SortButton, SettingsButton, PostsListSettings, HeadTags,
    AllPostsList,
  } = Components;

  return (
    <>
      <HeadTags description={description} />
      <AnalyticsContext pageContext="allPostsPage">
        <SingleColumnSection>
        <DeferRender ssr={false}>
          <TooltipRef
            title={`${showSettings ? "Hide": "Show"} options for sorting and filtering`}
            placement="top-end"
          >
            {(ref: Ref<HTMLDivElement>) => <div ref={ref} className={classes.title} onClick={toggleSettings}>
              <SectionTitle title={preferredHeadingCase("All Posts")}>
                {isFriendlyUI ?
                  <SortButton label={formatSort(currentSorting)} /> :
                  <SettingsButton label={`Sorted by ${ SORT_ORDER_OPTIONS[currentSorting].label }`}/>
                }
              </SectionTitle>
            </div>}
          </TooltipRef>
          {isFriendlyUI && !showSettings && <hr className={classes.divider} />}
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

const AllPostsPageComponent = registerComponent(
  "AllPostsPage",
  AllPostsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    AllPostsPage: typeof AllPostsPageComponent
  }
}

