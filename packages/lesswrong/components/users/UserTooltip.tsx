import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";

type UserTooltipProps = {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  children: ReactNode,
}

const UserTooltip =
  isEAForum
    ? ({user, placement, inlineBlock, children}: UserTooltipProps) => {
      const {EAHoverOver, EAUserTooltipContent} = Components;
      return (
        <EAHoverOver
          hoverOver={<EAUserTooltipContent user={user} />}
          placement={placement}
          inlineBlock={inlineBlock}
        >
          {children}
        </EAHoverOver>
      );
    }
    : ({user, placement, inlineBlock, children}: UserTooltipProps) => {
      const {LWTooltip, LWUserTooltipContent} = Components;
      return (
        <LWTooltip
          title={<LWUserTooltipContent user={user} />}
          placement={placement}
          inlineBlock={inlineBlock}
        >
          {children}
        </LWTooltip>
      );
    }

const UserTooltipComponent = registerComponent("UserTooltip", UserTooltip);

declare global {
  interface ComponentTypes {
    UserTooltip: typeof UserTooltipComponent
  }
}
