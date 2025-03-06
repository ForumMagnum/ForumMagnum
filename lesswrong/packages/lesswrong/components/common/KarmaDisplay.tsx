import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { forumTypeSetting } from "../../lib/instanceSettings";
import LWTooltip from "@/components/common/LWTooltip";
import { PopperPlacementType } from "@/components/mui-replacement";

const KarmaDisplay = ({document, placement="left", linkItem}: {
  document: VoteableType,
  placement?: PopperPlacementType,
  linkItem?: React.ReactNode,
}) => {
  const baseScore = forumTypeSetting.get() === "AlignmentForum"
    ? document.afBaseScore
    : document.baseScore;
  const afBaseScore = forumTypeSetting.get() !== "AlignmentForum" && document.af
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

const KarmaDisplayComponent = registerComponent("KarmaDisplay", KarmaDisplay);

declare global {
  interface ComponentTypes {
    KarmaDisplay: typeof KarmaDisplayComponent,
  }
}

export default KarmaDisplayComponent;
