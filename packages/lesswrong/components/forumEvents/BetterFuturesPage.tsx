import React, { useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import { BETTER_FUTURES_ID } from "@/lib/collections/forumEvents/helpers";
import SequenceEventPage from "./sequenceEvent/SequenceEventPage";
import HeadTags from "@/components/common/HeadTags";

export const BetterFuturesPage = () => {
  const sharingUrl = useCallback((source: string) => {
    return makeAbsolute(
      `/better-futures?utm_campaign=better_futures&utm_source=${source}`,
    );
  }, []);
  return (
    <AnalyticsContext pageContext="betterFutures">
      <HeadTags
        title="Better Futures"
        description='To make the future go better, we can either work to avoid near-term catastrophes like human extinction or improve the futures where we survive. This series from Forethought explores that second option. The essays are designed to be read in order, beginning with "Introducing Better Futures".'
        image="https://res.cloudinary.com/cea/image/upload/v1769778867/Grid/lxzkgegdmfwdstr1pfzz.png"
      />
      <SequenceEventPage
        shareTitle="Better Futures"
        sequenceId={BETTER_FUTURES_ID}
        sharingUrl={sharingUrl}
        themeColor="#EF7948"
        hoverColor="#FFF1EE"
        order="sequence"
      />
    </AnalyticsContext>
  );
}

export default registerComponent("BetterFuturesPage", BetterFuturesPage);
