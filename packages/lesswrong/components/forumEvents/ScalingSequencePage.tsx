import React, { useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
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
        description="What will effective charities actually do with your money?"
        image="https://res.cloudinary.com/cea/image/upload/v1763462529/SocialPreview/og-marginal-funding.jpg"
      />
      <SequenceEventPage
        shareTitle="The Scaling Sequence"
        sequenceId="gBjPorwZHRArNSQ5w"
        listenUrl="https://open.spotify.com/playlist/2wEYoo2FtV7OQQA0pATewT?si=XET3lr9aT9S-PFOGDvW6Kw"
        sharingUrl={sharingUrl}
        themeColor="#b8a0ff"
        hoverColor="#efefef"
      />
    </AnalyticsContext>
  );
}

export default registerComponent("ScalingSequencePage", ScalingSequencePage);
