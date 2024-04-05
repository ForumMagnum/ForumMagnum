import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { PopperPlacementType } from "@material-ui/core/Popper";

export const SequencesTooltip = ({
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
  const {HoverOver, SequencesSummary} = Components;
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

const SequencesTooltipComponent = registerComponent(
  "SequencesTooltip",
  SequencesTooltip,
);

declare global {
  interface ComponentTypes {
    SequencesTooltip: typeof SequencesTooltipComponent
  }
}
