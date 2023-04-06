import React, { ReactNode } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import type { PopperPlacementType } from "@material-ui/core/Popper/Popper";

const styles = (theme: ThemeType) => ({
  tooltip: isEAForum
    ? {
      background: theme.palette.grey[0],
      borderRadius: theme.borderRadius.default,
      border: `1px solid ${theme.palette.grey[120]}`,
      boxShadow: theme.palette.boxShadow.eaCard,
      padding: 12,
      marginTop: 2,
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
  const {LWTooltip, EAUserTooltipContent, LWUserTooltipContent} = Components;
  const Main = isEAForum ? EAUserTooltipContent : LWUserTooltipContent;

  return (
    <LWTooltip
      title={<Main user={user} />}
      placement={placement}
      inlineBlock={inlineBlock}
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
