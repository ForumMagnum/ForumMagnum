import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";
import { isFriendlyUI } from "../../themes/forumTheme";

const styles = (theme: ThemeType) => ({
  tooltip: isFriendlyUI
    ? {
      background: theme.palette.grey[0],
      borderRadius: theme.borderRadius.default,
      border: `1px solid ${theme.palette.grey[120]}`,
      boxShadow: theme.palette.boxShadow.eaCard,
      padding: 12,
      top: 2,
    }
    : {},
});

const UserTooltip = ({user, placement, inlineBlock, showTooltip = true, children, classes}: {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  showTooltip?: boolean,
  children: ReactNode,
  classes: ClassesType,
}) => {
  const {LWTooltip, EAUserTooltipContent, LWUserTooltipContent} = Components;
  const Main = isFriendlyUI ? EAUserTooltipContent : LWUserTooltipContent;

  return (
    <LWTooltip
      title={<Main user={user} />}
      placement={placement}
      inlineBlock={inlineBlock}
      disabled={!showTooltip}
      popperClassName={classes.tooltip}
    >
      {children}
    </LWTooltip>
  );
}

const UserTooltipComponent = registerComponent("UserTooltip", UserTooltip, {styles});

declare global {
  interface ComponentTypes {
    UserTooltip: typeof UserTooltipComponent
  }
}
