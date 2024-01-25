import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { AnnualReviewMarketInfo } from "../../lib/annualReviewMarkets";

const KarmaDisplay = ({document, placement="left", annualReviewMarketInfo = null, annualReviewYear = null}: {
  document: VoteableType,
  placement?: PopperPlacementType,
  annualReviewMarketInfo? : AnnualReviewMarketInfo | null,
  annualReviewYear? : number | null,
}) => {
  const baseScore = forumTypeSetting.get() === "AlignmentForum"
    ? document.afBaseScore
    : document.baseScore;
  const afBaseScore = forumTypeSetting.get() !== "AlignmentForum" && document.af
    ? document.afBaseScore
    : null;
  const {LWTooltip} = Components;
  return (
    <LWTooltip
      placement={placement}
      title={
        <div>
          {annualReviewMarketInfo && annualReviewMarketInfo.probability &&
            <div>{parseFloat((annualReviewMarketInfo.probability*100).toFixed(2))}% chance of {annualReviewMarketInfo.year} annual review winner</div>
          }
          <div>{baseScore ?? 0} karma</div>
          <div>({document.voteCount} votes)</div>
          {afBaseScore &&
            <div><em>({afBaseScore} karma on AlignmentForum.org)</em></div>
          }
        </div>
      }
    >
      {baseScore ?? 0}
    </LWTooltip>
  );
};

const KarmaDisplayComponent = registerComponent("KarmaDisplay", KarmaDisplay);

declare global {
  interface ComponentTypes {
    KarmaDisplay: typeof KarmaDisplayComponent,
  }
}
