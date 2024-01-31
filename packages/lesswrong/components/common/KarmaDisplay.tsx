import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { AnnualReviewMarketInfo, highlightMarket } from "../../lib/annualReviewMarkets";
import { Link } from "../../lib/reactRouterWrapper";
import { commentGetPageUrl } from "../../lib/collections/comments/helpers";
import { useSingle } from "../../lib/crud/withSingle";

const KarmaDisplay = ({document, placement="left", annualReviewMarketInfo, annualReviewMarketCommentId}: {
  document: VoteableType,
  placement?: PopperPlacementType,
  annualReviewMarketInfo?: AnnualReviewMarketInfo,
  annualReviewMarketCommentId?: string,
}) => {
  const baseScore = forumTypeSetting.get() === "AlignmentForum"
    ? document.afBaseScore
    : document.baseScore;
  const afBaseScore = forumTypeSetting.get() !== "AlignmentForum" && document.af
    ? document.afBaseScore
    : null;
  const {LWTooltip} = Components;

  const {document: comment} = useSingle({
    documentId: annualReviewMarketCommentId,
    collectionName: "Comments",
    fragmentName: "CommentsListWithParentMetadata",
    skip: !annualReviewMarketCommentId,
  })

  return (
    <LWTooltip
      placement={placement}
      clickable={highlightMarket(annualReviewMarketInfo)}
      title={
        <div>
          <div>{baseScore ?? 0} karma</div>
          <div>({document.voteCount} votes)</div>
          {annualReviewMarketInfo && highlightMarket(annualReviewMarketInfo) &&
            !!comment && 
              <Link to={commentGetPageUrl(comment)}><span>{annualReviewMarketInfo.year} Top Fifty: {parseFloat((annualReviewMarketInfo.probability*100).toFixed(0))}%</span></Link>
          }
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
