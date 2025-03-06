import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import HoverOver from "@/components/common/HoverOver";
import SequencesSummary from "@/components/sequences/SequencesSummary";
import { PopperPlacementType } from "@/components/mui-replacement";

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

export default SequencesTooltipComponent;
