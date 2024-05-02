import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentCuratedPostCount } from "../hooks/useCurrentCuratedPostCount";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isEAForum } from "../../lib/instanceSettings";
import moment from "moment";
import { useTimezone } from "../common/withTimezone";

const CuratedPostsList = ({overrideLimit}: {overrideLimit?: number}) => {
  const currentCuratedPostCount = useCurrentCuratedPostCount();
  const { timezone } = useTimezone()
  const fiveDaysAgo = moment().tz(timezone).subtract(5, 'days').format("YYYY-MM-DD")

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
