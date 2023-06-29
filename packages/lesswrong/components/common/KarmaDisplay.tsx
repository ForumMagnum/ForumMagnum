import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper";
import { forumTypeSetting } from "../../lib/instanceSettings";

const KarmaDisplay = ({document, placement="left"}: {
  document: VoteableType,
  placement?: PopperPlacementType,
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
