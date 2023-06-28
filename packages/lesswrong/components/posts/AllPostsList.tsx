import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useTimezone } from "../common/withTimezone";
import { useLocation } from "../../lib/routeUtil";
import { AllowHidingFrontPagePostsContext } from "../dropdowns/posts/PostActions";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import {
  DEFAULT_LOW_KARMA_THRESHOLD,
  MAX_LOW_KARMA_THRESHOLD,
} from "../../lib/collections/posts/views";
import {
  getBeforeDefault,
  getAfterDefault,
  timeframeToTimeBlock,
  TimeframeType,
} from "./timeframeUtils";
import {
  forumAllPostsNumDaysSetting,
  DatabasePublicSetting,
} from "../../lib/publicSettings";

// Number of weeks to display in the timeframe view
const forumAllPostsNumWeeksSetting = new DatabasePublicSetting<number>("forum.numberOfWeeks", 4);
// Number of months to display in the timeframe view
const forumAllPostsNumMonthsSetting = new DatabasePublicSetting<number>("forum.numberOfMonths", 4);
// Number of years to display in the timeframe view
const forumAllPostsNumYearsSetting = new DatabasePublicSetting<number>("forum.numberOfYears", 4);

const timeframeToNumTimeBlocks = {
  daily: forumAllPostsNumDaysSetting.get(),
  weekly: forumAllPostsNumWeeksSetting.get(),
  monthly: forumAllPostsNumMonthsSetting.get(),
  yearly: forumAllPostsNumYearsSetting.get(),
}

const AllPostsList = ({
  currentTimeframe,
  currentSorting,
  currentFilter,
  currentShowLowKarma,
  currentIncludeEvents,
  currentHideCommunity,
  showSettings,
}: {
  currentTimeframe: string,
  currentFilter: string,
  currentSorting: PostSortingMode,
  currentShowLowKarma: boolean,
  currentIncludeEvents: boolean,
  currentHideCommunity: boolean,
  showSettings: boolean,
}) => {
  const {timezone} = useTimezone();
  const {query} = useLocation();

  const baseTerms: PostsViewTerms = {
    karmaThreshold: query.karmaThreshold || (currentShowLowKarma
      ? MAX_LOW_KARMA_THRESHOLD
      : DEFAULT_LOW_KARMA_THRESHOLD),
    excludeEvents: !currentIncludeEvents && currentFilter !== "events",
    hideCommunity: currentHideCommunity,
    filter: currentFilter,
    sortedBy: currentSorting,
    after: query.after,
    before: query.before,
  };

  const {PostsTimeframeList, PostsList2} = Components;

  if (currentTimeframe === "allTime") {
    return (
      <AnalyticsContext
        listContext={"allPostsPage"}
        terms={{view: "allTime", ...baseTerms}}
      >
        <PostsList2
          terms={{
            ...baseTerms,
            limit: 50
          }}
          dimWhenLoading={showSettings}
        />
      </AnalyticsContext>
    );
  }

  const numTimeBlocks = timeframeToNumTimeBlocks[currentTimeframe as TimeframeType];
  const timeBlock = timeframeToTimeBlock[currentTimeframe as TimeframeType];

  const postListParameters: PostsViewTerms = {
    view: "timeframe",
    ...baseTerms,
  };

  if (parseInt(query.limit)) {
    postListParameters.limit = parseInt(query.limit);
  }

  const after = query.after || getAfterDefault({
    numTimeBlocks,
    timeBlock,
    timezone,
    before: query.before,
  });
  const before = query.before  || getBeforeDefault({
    timeBlock,
    timezone,
    after: query.after,
  });

  const hideTags = currentFilter === "curated"
    || currentFilter === "questions"
    || currentFilter === "events";
  const hideShortform = query.includeShortform === "false" || hideTags;

  return (
    <div>
      <AnalyticsContext
        listContext={"allPostsPage"}
        terms={postListParameters}
        capturePostItemOnMount
      >
        {/* Allow unhiding posts from all posts menu to allow recovery of hiding
          * the wrong post */}
        <AllowHidingFrontPagePostsContext.Provider value={true}>
          <PostsTimeframeList
            // TODO: this doesn't seem to be guaranteed, actually?  Since it can
            // come from an unsanitized query param...
            timeframe={currentTimeframe as TimeframeType}
            postListParameters={postListParameters}
            numTimeBlocks={numTimeBlocks}
            dimWhenLoading={showSettings}
            after={after}
            before={before}
            reverse={query.reverse === "true"}
            displayShortform={!hideShortform}
            includeTags={!hideTags}
          />
        </AllowHidingFrontPagePostsContext.Provider>
      </AnalyticsContext>
    </div>
  );
}

const AllPostsListComponent = registerComponent("AllPostsList", AllPostsList);

declare global {
  interface ComponentTypes {
    AllPostsList: typeof AllPostsListComponent
  }
}
