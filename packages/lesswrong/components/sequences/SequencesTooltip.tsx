import type { Placement as PopperPlacementType } from "popper.js";
import { ReactNode } from "react";
import HoverOver from "../common/HoverOver";
import SequencesSummary from "./SequencesSummary";

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

export default SequencesTooltip;
