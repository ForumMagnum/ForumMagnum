import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";

const styles = () => ({
  root: isEAForum
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
  const {
    EAHoverOver, EAUserTooltipContent, LWTooltip, LWUserTooltipContent,
  } = Components;
  const Tooltip = isEAForum ? EAHoverOver : LWTooltip;
  const Content = isEAForum ? EAUserTooltipContent : LWUserTooltipContent;
  return (
    <Tooltip
      title={<Content user={user} />}
      placement={placement}
      inlineBlock={inlineBlock}
      popperClassName={classes.root}
    >
      {children}
    </Tooltip>
  );
}

const UserTooltipComponent = registerComponent("UserTooltip", UserTooltip, {styles});

declare global {
  interface ComponentTypes {
    UserTooltip: typeof UserTooltipComponent
  }
}
