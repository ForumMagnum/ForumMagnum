import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from './withHover';
import type { PopperPlacementType } from '@material-ui/core/Popper'
import classNames from 'classnames';
import { AnalyticsProps } from '../../lib/analyticsEvents';

const styles = (_theme: ThemeType) => ({
  root: {
    // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
    display: "inline-block",
  },
  tooltip: {
    maxWidth: 300,
    
    "& img": {
      maxWidth: "100%",
    },
  }
})

export type LWTooltipProps = {
  title?: ReactNode,
  placement?: PopperPlacementType,
  tooltip?: boolean,
  flip?: boolean,
  clickable?: boolean,
  inlineBlock?: boolean,
  As?: keyof JSX.IntrinsicElements,
  disabled?: boolean,
  hideOnTouchScreens?: boolean,
  className?: string,
  analyticsProps?: AnalyticsProps,
  otherEventProps?: Record<string, Json | undefined>,
  titleClassName?: string
  popperClassName?: string,
  onShow?: () => void,
  onHide?: () => void,
  children?: ReactNode,
  forceOpen?: boolean,
  classes: ClassesType<typeof styles>,
}

const LWTooltip = ({
  title,
  placement="bottom-start",
  tooltip=true,
  flip=true,
  clickable=false,
  inlineBlock=true,
  As="span",
  disabled=false,
  hideOnTouchScreens=false,
  analyticsProps,
  otherEventProps,
  titleClassName,
  popperClassName,
  onShow,
  onHide,
  children,
  className,
  forceOpen,
  classes,
}: LWTooltipProps) => {
  const { LWPopper } = Components
  const [delayedClickable, setDelayedClickable] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearDelayTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const { hover, everHovered, anchorEl, eventHandlers } = useHover({
    eventProps: {
      pageElementContext: "tooltipHovered", // Can be overwritten by analyticsProps
      title: typeof title === "string" ? title : undefined,
      ...analyticsProps,
      ...otherEventProps,
    },
    onEnter: onShow,
    onLeave: () => {
      onHide?.();
      clearDelayTimeout();
      setDelayedClickable(false);
    },
  });

  // For the clickable case, we want to delay the opening of the tooltip by 200ms
  // so that users aren't interrupted when moving their mouse rapidly over
  // clickable elements
  useEffect(() => {
    if (hover && clickable) {
      clearDelayTimeout();
      timeoutRef.current = setTimeout(() => {
        setDelayedClickable(true);
        timeoutRef.current = null;
      }, 200);
    } else {
      clearDelayTimeout();
      setDelayedClickable(false);
    }
    
    return clearDelayTimeout;
  }, [hover, clickable, clearDelayTimeout]);

  if (!title) return <>{children}</>

  return <As className={classNames(
    inlineBlock && classes.root,
    className
  )} {...eventHandlers}>
    { /* Only render the LWPopper if this element has ever been hovered. (But
         keep it in the React tree thereafter, so it can remember its state and
         can have a closing animation if applicable. */ }
    {everHovered && <LWPopper
      placement={placement}
      open={forceOpen || (hover && !disabled)}
      anchorEl={anchorEl}
      tooltip={tooltip}
      allowOverflow={!flip}
      clickable={delayedClickable}
      hideOnTouchScreens={hideOnTouchScreens}
      className={popperClassName}
    >
      <div className={classNames(
        tooltip && classes.tooltip,
        titleClassName
      )}>
        {title}
      </div>
    </LWPopper>}

    {children}
  </As>
}

const LWTooltipComponent = registerComponent("LWTooltip", LWTooltip, {
  styles,
  stylePriority: -1,
});

declare global {
  interface ComponentTypes {
    LWTooltip: typeof LWTooltipComponent
  }
}
