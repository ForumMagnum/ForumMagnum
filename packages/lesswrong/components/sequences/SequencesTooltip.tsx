import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { Placement as PopperPlacementType } from "popper.js"
import { HoverOver } from "../common/HoverOver";
import { SequencesSummary } from "./SequencesSummary";

export const SequencesTooltipInner = ({
  sequence,
  showAuthor = true,
  allowOverflow,
  placement,
  children,
}: {
  sequence: SequencesPageFragment|null,
  showAuthor?: boolean,
  allowOverflow?: boolean,
  placement?: PopperPlacementType,
  children?: ReactNode,
}) => {
  return (
    <HoverOver
      title={
        <SequencesSummary
          sequence={sequence}
          showAuthor={showAuthor}
          maxPosts={isFriendlyUI ? 8 : undefined}
        />
      }
      tooltip={false}
      inlineBlock={false}
      flip={!allowOverflow}
      placement={placement}
      clickable
    >
      {children}
    </HoverOver>
  );
}

export const SequencesTooltip = registerComponent(
  "SequencesTooltip",
  SequencesTooltipInner,
);


