import React, { useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import { IN_DEVELOPMENT_SERIES_ID } from "@/lib/collections/forumEvents/helpers";
import SequenceEventPage from "./sequenceEvent/SequenceEventPage";
import HeadTags from "@/components/common/HeadTags";

// TODO: Sequence id, description, image, listenURL

export const InDevelopmentPage = () => {
  const sharingUrl = useCallback((source: string) => {
    return makeAbsolute(
      `/in-development-highlight?utm_campaign=in-development&utm_source=${source}`,
    );
  }, []);
  return (
    <AnalyticsContext pageContext="inDevelopment">
      <HeadTags
        title="In Development Highlight"
        description="TODO Description"
        image="https://res.cloudinary.com/cea/image/upload/v1769778867/Grid/lxzkgegdmfwdstr1pfzz.png"
      />
      <SequenceEventPage
        shareTitle="In Development Highlight"
        sequenceId={IN_DEVELOPMENT_SERIES_ID}
        sharingUrl={sharingUrl}
        themeColor="#67ADB8"
        hoverColor="#f8f5ff"
      />
    </AnalyticsContext>
  );
}

export default registerComponent("InDevelopmentPage", InDevelopmentPage);
