import React, { ReactNode } from "react";
import type { Placement as PopperPlacementType } from "popper.js"
import type { AnalyticsProps } from "../../lib/analyticsEvents";
import classNames from "classnames";
import LWTooltip from "./LWTooltip";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

export const FRIENDLY_THIN_HOVER_OVER_WIDTH = 270;
export const FRIENDLY_HOVER_OVER_WIDTH = 340;

export const friendlyHoverOverRootStyles = (theme: ThemeType) => ({
  background: theme.palette.grey[0],
  borderRadius: theme.borderRadius.default,
  border: `1px solid ${theme.palette.grey[120]}`,
  boxShadow: theme.palette.boxShadow.eaCard,
});

const styles = defineStyles("FriendlyHoverOver", (theme: ThemeType) => ({
  root: {
    ...friendlyHoverOverRootStyles(theme),
  },
}), {
  stylePriority: -1,
});

export type FriendlyHoverOverProps = {
  /**
   * This is the contents of the hover over, named `title` for compatability
   * with LWTooltip
   */
  title: ReactNode,
  placement?: PopperPlacementType,
  inlineBlock?: boolean,
  As?: 'span' | 'div',
  clickable?: boolean,
  flip?: boolean,
  analyticsProps?: AnalyticsProps,
  className?: string,
  popperClassName?: string,
  onShow?: () => void,
  onHide?: () => void,
  children: ReactNode,
  forceOpen?: boolean,
}

/**
 * This component should not be used directly - instead use `HoverOver` which
 * will switch between the correct styles depending on whether or not the
 * current site is using friendly UI.
 */
const FriendlyHoverOver = ({
  title,
  placement,
  inlineBlock,
  As,
  clickable,
  flip,
  analyticsProps,
  className,
  popperClassName,
  onShow,
  onHide,
  children,
  forceOpen,
}: FriendlyHoverOverProps) => {
  const classes = useStyles(styles);
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
      onShow={onShow}
      onHide={onHide}
      className={className}
      forceOpen={forceOpen}
    >
      {children}
    </LWTooltip>
  );
}

export default FriendlyHoverOver;
