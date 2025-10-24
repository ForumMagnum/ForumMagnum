import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import type { Placement as PopperPlacementType } from "popper.js"
import LWTooltip from "./LWTooltip";
import { useForumType } from "../hooks/useForumType";

const KarmaDisplay = ({document, placement="left", linkItem}: {
  document: VoteableType,
  placement?: PopperPlacementType,
  linkItem?: React.ReactNode,
}) => {
  const { isAF } = useForumType();
  const baseScore = isAF
    ? document.afBaseScore
    : document.baseScore;
  const afBaseScore = !isAF && document.af
    ? document.afBaseScore
    : null;
  return (
    <LWTooltip
      placement={placement}
      clickable={!!linkItem}
      title={
        <div>
          <div>{baseScore ?? 0} karma</div>
          <div>({document.voteCount} votes)</div>
          {linkItem}
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

export default registerComponent("KarmaDisplay", KarmaDisplay);


