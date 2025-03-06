import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";
import { isFriendlyUI } from "../../themes/forumTheme";
import HoverOver from "@/components/common/HoverOver";
import EAUserTooltipContent from "@/components/users/EAUserTooltipContent";
import LWUserTooltipContent from "@/components/users/LWUserTooltipContent";

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

const UserTooltip = ({user, placement, inlineBlock, hideFollowButton, children, classes}: {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  // LW specific
  hideFollowButton?: boolean,
  children: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
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

export default UserTooltipComponent;
