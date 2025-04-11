import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type { Placement as PopperPlacementType } from "popper.js"
import { isFriendlyUI } from "../../themes/forumTheme";

const styles = () => ({
  root: isFriendlyUI
    ? {
      padding: 12,
      top: 2,
    }
    : {
      padding: 0,
      background: "unset",
    },
  overrideTooltip: isFriendlyUI
  ? {}
  : {
    padding: 0,
    maxWidth: "none",
  }
});

const UserTooltip = ({user, placement, inlineBlock, hideFollowButton, disabled, children, classes}: {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  // LW specific
  hideFollowButton?: boolean,
  disabled?: boolean,
  children: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
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
      clickable={!isFriendlyUI}
      disabled={disabled}
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
