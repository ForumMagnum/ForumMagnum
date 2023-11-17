import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentCuratedPostCount } from "../hooks/useCurrentCuratedPostCount";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const CuratedPostsList = () => {
  const currentCuratedPostCount = useCurrentCuratedPostCount();
  return (
    <AnalyticsContext listContext="curatedPosts" pageSubSectionContext="curatedPosts">
      <Components.PostsList2
        terms={{view:"curated", limit: currentCuratedPostCount}}
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
