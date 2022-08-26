import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const CuratedPostsList = () => {
  const currentUser = useCurrentUser();
  return (
    <AnalyticsContext listContext="curatedPosts" pageSubSectionContext="curatedPosts">
      <Components.PostsList2
        terms={{view:"curated", limit: currentUser ? 3 : 2}}
        showNoResults={false}
        showLoadMore={false}
        hideLastUnread={true}
        boxShadow={false}
        curatedIconLeft={true}
        showFinalBottomBorder
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
