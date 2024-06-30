import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentCuratedPostCount } from "../hooks/useCurrentCuratedPostCount";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isEAForum } from "../../lib/instanceSettings";
import moment from "moment";
import { useCurrentTime } from "../../lib/utils/timeUtil";

const CuratedPostsList = ({overrideLimit}: {overrideLimit?: number}) => {
  const currentCuratedPostCount = useCurrentCuratedPostCount();
  const now = useCurrentTime();

  const fiveDaysAgo = moment(now).subtract(5*24, 'hours').startOf("hour").toISOString();

  return (
    <AnalyticsContext listContext="curatedPosts" pageSubSectionContext="curatedPosts">
      <Components.PostsList2
        terms={{
          view: "curated",
          limit: overrideLimit ?? currentCuratedPostCount,
          ...(isEAForum ? {curatedAfter: fiveDaysAgo} : {}),
        }}
        showNoResults={false}
        showLoadMore={false}
        hideLastUnread={true}
        boxShadow={false}
        curatedIconLeft={true}
        showFinalBottomBorder
        viewType="fromContext"
      />
    </AnalyticsContext>
  );
}

const CuratedPostsListComponent = registerComponent("CuratedPostsList", CuratedPostsList, {});

declare global {
  interface ComponentTypes {
    CuratedPostsList: typeof CuratedPostsListComponent
  }
}
