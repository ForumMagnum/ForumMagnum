import React, { ReactNode } from "react";
import type { TooltipPlacement } from "@/components/common/TooltipGroup";
import HoverOver from "../common/HoverOver";
import LWUserTooltipContent from "./LWUserTooltipContent";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

const styles = defineStyles("UserTooltip", (theme: ThemeType) => ({
  root: {
    padding: 0,
    background: "unset",
  },
  overrideTooltip: {
    padding: 0,
    maxWidth: "none",
  }
}));

const UserTooltip = ({user, placement, inlineBlock, hideFollowButton, disabled, children}: {
  user: UsersMinimumInfo,
  placement?: TooltipPlacement,
  inlineBlock?: boolean,
  // LW specific
  hideFollowButton?: boolean,
  disabled?: boolean,
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const content = <LWUserTooltipContent user={user} hideFollowButton={hideFollowButton} />;
  return (
    <HoverOver
      title={content}
      placement={placement}
      inlineBlock={inlineBlock}
      popperClassName={classes.root}
      titleClassName={classes.overrideTooltip}
      clickable
      disabled={disabled}
    >
      {children}
    </HoverOver>
  );
}

export default UserTooltip;


