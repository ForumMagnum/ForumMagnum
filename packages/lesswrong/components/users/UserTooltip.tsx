import React, { ReactNode } from "react";
import type { Placement as PopperPlacementType } from "popper.js"
import HoverOver from "../common/HoverOver";
import EAUserTooltipContent from "./EAUserTooltipContent";
import LWUserTooltipContent from "./LWUserTooltipContent";
import { isFriendlyUI } from "@/themes/forumTheme";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

const styles = defineStyles("UserTooltip", (theme: ThemeType) => ({
  root: theme.isFriendlyUI
    ? {
      padding: 12,
      top: 2,
    }
    : {
      padding: 0,
      background: "unset",
    },
  overrideTooltip: theme.isFriendlyUI
  ? {}
  : {
    padding: 0,
    maxWidth: "none",
  }
}));

const UserTooltip = ({user, placement, inlineBlock, hideFollowButton, disabled, children}: {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  // LW specific
  hideFollowButton?: boolean,
  disabled?: boolean,
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const content = isFriendlyUI()
    ? <EAUserTooltipContent user={user} />
    : <LWUserTooltipContent user={user} hideFollowButton={hideFollowButton} />;
  return (
    <HoverOver
      title={content}
      placement={placement}
      inlineBlock={inlineBlock}
      popperClassName={classes.root}
      titleClassName={classes.overrideTooltip}
      clickable={!isFriendlyUI()}
      disabled={disabled}
    >
      {children}
    </HoverOver>
  );
}

export default UserTooltip;


