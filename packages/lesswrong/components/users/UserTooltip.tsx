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
    : {},
});

const UserTooltip = ({user, placement, inlineBlock, children, classes}: {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  children: ReactNode,
  classes: ClassesType,
}) => {
  const {HoverOver, EAUserTooltipContent, LWUserTooltipContent} = Components;
  const Content = isFriendlyUI ? EAUserTooltipContent : LWUserTooltipContent;
  return (
    <HoverOver
      title={<Content user={user} />}
      placement={placement}
      inlineBlock={inlineBlock}
      popperClassName={classes.root}
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
