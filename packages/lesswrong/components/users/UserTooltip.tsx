import type { Placement as PopperPlacementType } from "popper.js";
import { ReactNode } from "react";
import HoverOver from "../common/HoverOver";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";
import LWUserTooltipContent from "./LWUserTooltipContent";

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
  placement?: PopperPlacementType,
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
      clickable={true}
      disabled={disabled}
    >
      {children}
    </HoverOver>
  );
}

export default UserTooltip;


