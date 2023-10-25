import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { PopperPlacementType } from "@material-ui/core/Popper";
import type { AnalyticsProps } from "../../lib/analyticsEvents";
import classNames from "classnames";

export const EA_THIN_HOVER_OVER_WIDTH = 270;
export const EA_HOVER_OVER_WIDTH = 340;

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[120]}`,
    boxShadow: theme.palette.boxShadow.eaCard,
  },
});

const EAHoverOver = ({
  title,
  children,
  placement,
  inlineBlock,
  As,
  clickable,
  flip,
  analyticsProps,
  className,
  popperClassName,
  classes,
}: {
  /**
   * This is the contents of the hover over, named `title` for compatability
   * with LWTooltip
   */
  title: ReactNode,
  children: ReactNode,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  As?: keyof JSX.IntrinsicElements,
  clickable?: boolean,
  flip?: boolean,
  analyticsProps?: AnalyticsProps,
  className?: string,
  popperClassName?: string,
  classes: ClassesType,
}) => {
  const {LWTooltip} = Components;
  return (
    <LWTooltip
      title={title}
      placement={placement}
      inlineBlock={inlineBlock}
      popperClassName={classNames(classes.root, popperClassName)}
      tooltip={false}
      hideOnTouchScreens
      As={As}
      clickable={clickable}
      flip={flip}
      analyticsProps={analyticsProps}
      className={className}
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
