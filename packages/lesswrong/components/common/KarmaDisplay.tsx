import { useForumType } from '@/components/hooks/useForumType';
import React from "react";
import type { TooltipPlacement } from "@/components/common/TooltipGroup";
import LWTooltip from "./LWTooltip";

const KarmaDisplay = ({document, placement="left", linkItem}: {
  document: VoteableType,
  placement?: TooltipPlacement,
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

export default KarmaDisplay;


