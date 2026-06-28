import React, { useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import { requireCssVar } from "@/themes/cssVars";
import {
  MARGINAL_FUNDING_SEQUENCE_ID,
  MARGINAL_FUNDING_SPOTIFY_URL,
} from "@/lib/givingSeason";
import SequenceEventPage from "../sequenceEvent/SequenceEventPage";
import HeadTags from "@/components/common/HeadTags";

const themeColor = requireCssVar("palette", "givingSeason", "primary");
const hoverColor = requireCssVar("palette", "givingSeason", "cardHover");

export const MarginalFundingPage = () => {
  const sharingUrl = useCallback((source: string) => {
    return makeAbsolute(
      `/marginal-funding?utm_campaign=marginal_funding&utm_source=${source}`,
    );
  }, []);
  return (
    <AnalyticsContext pageContext="marginalFunding">
      <HeadTags
        title="Marginal funding"
        description="What will effective charities actually do with your money?"
        image="https://res.cloudinary.com/cea/image/upload/v1763462529/SocialPreview/og-marginal-funding.jpg"
      />
      <SequenceEventPage
        shareTitle="Marginal Funding Week"
        sequenceId={MARGINAL_FUNDING_SEQUENCE_ID}
        listenUrl={MARGINAL_FUNDING_SPOTIFY_URL}
        sharingUrl={sharingUrl}
        themeColor={themeColor}
        hoverColor={hoverColor}
      />
    </AnalyticsContext>
  );
}

export default registerComponent("MarginalFundingPage", MarginalFundingPage);
