import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";
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
    background: "unset"
  }
});

const UserTooltip = ({user, placement, inlineBlock, hideFollowButton, children, classes}: {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  // LW specific
  hideFollowButton?: boolean,
  children: ReactNode,
  classes: ClassesType,
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
      className={classes.overrideTooltip}
      clickable={!isFriendlyUI}
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
