import React, { useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import { SCALING_SERIES_ID } from "@/lib/collections/forumEvents/helpers";
import SequenceEventPage from "./sequenceEvent/SequenceEventPage";
import HeadTags from "@/components/common/HeadTags";

export const ScalingSeriesPage = () => {
  const sharingUrl = useCallback((source: string) => {
    return makeAbsolute(
      `/scaling-series?utm_campaign=scaling_series&utm_source=${source}`,
    );
  }, []);
  return (
    <AnalyticsContext pageContext="scalingSeries">
      <HeadTags
        title="The Scaling Series"
        description="Toby Ord's analysis of why AI scaling costs are exploding while returns diminish, and what that means for the future."
        image="https://res.cloudinary.com/cea/image/upload/v1769690620/scaling_u0ydjc.png"
      />
      <SequenceEventPage
        shareTitle="The Scaling Series"
        sequenceId={SCALING_SERIES_ID}
        listenUrl="https://open.spotify.com/playlist/6xFKOOKfOu52pzWXeh4u5r?si=c71ac51c39a84e73"
        sharingUrl={sharingUrl}
        themeColor="#b8a0ff"
        hoverColor="#efefef"
      />
    </AnalyticsContext>
  );
}

export default registerComponent("ScalingSeriesPage", ScalingSeriesPage);
