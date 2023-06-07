import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper";

const KarmaDisplay = ({baseScore, voteCount, afBaseScore, placement="left"}: {
  baseScore?: number,
  voteCount?: number,
  afBaseScore?: number,
  placement?: PopperPlacementType,
}) => {
  const {LWTooltip} = Components;
  return (
    <LWTooltip
      placement={placement}
      title={
        <div>
          <div>{baseScore ?? 0} karma</div>
          <div>({voteCount} votes)</div>
          {!!afBaseScore &&
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
