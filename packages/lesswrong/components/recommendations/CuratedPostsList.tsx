import moment from "moment";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useCurrentTime } from "../../lib/utils/timeUtil";
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentCuratedPostCount } from "../hooks/useCurrentCuratedPostCount";
import PostsList2 from "../posts/PostsList2";

const CuratedPostsList = ({overrideLimit, repeatedPostsPrecedence}: {
  overrideLimit?: number
  repeatedPostsPrecedence?: number
}) => {
  const currentCuratedPostCount = useCurrentCuratedPostCount();
  const now = useCurrentTime();

  const fiveDaysAgo = moment(now).subtract(5*24, 'hours').startOf("hour").toISOString();

  return (
    <AnalyticsContext listContext="curatedPosts" pageSubSectionContext="curatedPosts">
      <PostsList2
        terms={{
          view: "curated",
          limit: overrideLimit ?? currentCuratedPostCount,
          ...({}),
        }}
        showNoResults={false}
        showLoadMore={false}
        hideLastUnread={true}
        boxShadow={false}
        curatedIconLeft={true}
        showFinalBottomBorder
        viewType="fromContext"
        repeatedPostsPrecedence={repeatedPostsPrecedence}
      />
    </AnalyticsContext>
  );
}

export default registerComponent("CuratedPostsList", CuratedPostsList, {});


