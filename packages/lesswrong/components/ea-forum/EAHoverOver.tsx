import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[120]}`,
    boxShadow: theme.palette.boxShadow.eaCard,
    padding: 12,
    top: 2,
  },
});

const EAHoverOver = ({
  hoverOver,
  children,
  placement,
  inlineBlock,
  className,
  classes,
}: {
  hoverOver: ReactNode,
  children: ReactNode,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  const {LWTooltip} = Components;
  return (
    <LWTooltip
      title={hoverOver}
      placement={placement}
      inlineBlock={inlineBlock}
      popperClassName={classNames(classes.root, className)}
      tooltip={false}
    >
      {children}
    </LWTooltip>
  );
}

const EAHoverOverComponent = registerComponent(
  "EAHoverOver",
  EAHoverOver,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    EAHoverOver: typeof EAHoverOverComponent
  }
}
