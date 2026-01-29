import React, { useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import { SCALING_SEQUENCE_ID } from "@/lib/collections/forumEvents/helpers";
import SequenceEventPage from "./sequenceEvent/SequenceEventPage";
import HeadTags from "@/components/common/HeadTags";

export const ScalingSequencePage = () => {
  const sharingUrl = useCallback((source: string) => {
    return makeAbsolute(
      `/scaling-sequence?utm_campaign=scaling_sequence&utm_source=${source}`,
    );
  }, []);
  return (
    <AnalyticsContext pageContext="scalingSequence">
      <HeadTags
        title="The Scaling Sequence"
        description="Toby Ord's analysis of why AI scaling costs are exploding while returns diminish, and what that means for the future."
        image="https://res.cloudinary.com/cea/image/upload/v1769690620/scaling_u0ydjc.png"
      />
      <SequenceEventPage
        shareTitle="The Scaling Sequence"
        sequenceId={SCALING_SEQUENCE_ID}
        listenUrl="https://open.spotify.com/playlist/6xFKOOKfOu52pzWXeh4u5r?si=c71ac51c39a84e73"
        sharingUrl={sharingUrl}
        themeColor="#b8a0ff"
        hoverColor="#efefef"
      />
    </AnalyticsContext>
  );
}

export default registerComponent("ScalingSequencePage", ScalingSequencePage);
