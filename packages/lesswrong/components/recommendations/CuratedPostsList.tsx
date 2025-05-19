import React from "react";
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentCuratedPostCount } from "../hooks/useCurrentCuratedPostCount";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { isEAForum } from "../../lib/instanceSettings";
import moment from "moment";
import { useCurrentTime } from "../../lib/utils/timeUtil";
import PostsList2 from "../posts/PostsList2";

const CuratedPostsList = ({overrideLimit}: {overrideLimit?: number}) => {
  const currentCuratedPostCount = useCurrentCuratedPostCount();
  const now = useCurrentTime();

  const fiveDaysAgo = moment(now).subtract(5*24, 'hours').startOf("hour").toISOString();

  return (
    <AnalyticsContext listContext="curatedPosts" pageSubSectionContext="curatedPosts">
      <PostsList2
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

export default registerComponent("CuratedPostsList", CuratedPostsList, {});


