import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { LWTooltipProps } from "../common/LWTooltip";
import type { FriendlyHoverOverProps } from "../common/FriendlyHoverOver";

const styles = () => ({
  root: isFriendlyUI
    ? {
      padding: 12,
      top: 2,
    }
    : {
      padding: 0,
    },
  overrideTooltip: isFriendlyUI
  ? {}
  : {
    padding: 0,
    maxWidth: "none",
  }
});

export type HoverPassthroughProps = Pick<LWTooltipProps & FriendlyHoverOverProps, 'placement' | 'inlineBlock' | 'clickable'>;

const UserTooltip = ({user, placement, inlineBlock, clickable, hideFollowButton, children, classes}: {
  user: UsersMinimumInfo,
  // LW specific
  hideFollowButton?: boolean,
  children: ReactNode,
  classes: ClassesType,
} & HoverPassthroughProps) => {
  const {HoverOver, EAUserTooltipContent, LWUserTooltipContent} = Components;
  const content = isFriendlyUI 
    ? <EAUserTooltipContent user={user} />
    : <LWUserTooltipContent user={user} hideFollowButton={hideFollowButton} />;
  return (
    <HoverOver
      title={content}
      placement={placement}
      inlineBlock={inlineBlock}
      popperClassName={classes.root}
      titleClassName={classes.overrideTooltip}
      clickable={clickable}
    >
      {children}
    </HoverOver>
  );
}

const UserTooltipComponent = registerComponent("UserTooltip", UserTooltip, {styles});

declare global {
  interface ComponentTypes {
    UserTooltip: typeof UserTooltipComponent
  }
}
