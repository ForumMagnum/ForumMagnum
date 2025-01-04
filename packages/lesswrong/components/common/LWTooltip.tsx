import React, { ReactNode } from 'react';
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
  const { hover, everHovered, anchorEl, eventHandlers } = useHover({
    eventProps: {
      pageElementContext: "tooltipHovered", // Can be overwritten by analyticsProps
      title: typeof title === "string" ? title : undefined,
      ...analyticsProps,
      ...otherEventProps,
    },
    onEnter: onShow,
    onLeave: onHide,
  });

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
      clickable={clickable}
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
