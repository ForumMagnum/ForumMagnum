import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from './withHover';

const styles = theme => ({
  root: {
    // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
    display: "inline-block",
  },
  tooltip: {
    maxWidth: 300
  }
})

interface ExternalProps {
  children?: React.ReactNode,
  title?: any,
  placement?: string,
  tooltip?: boolean,
  flip?: boolean,
}
interface LWTooltipProps extends ExternalProps, WithStylesProps, WithHoverProps {
}

const LWTooltip = ({classes, children, title, placement="bottom-start", hover, anchorEl, stopHover, tooltip=true, flip=true}: LWTooltipProps) => {
  const { LWPopper } = Components
  const { hover, anchorEl, stopHover, eventHandlers } = useHover({
    pageElementContext: "tooltipHovered",
    title: typeof title=="string" ? title : undefined
  });
  return <span className={classes.root}>
    <LWPopper 
      placement={placement} 
      open={hover} 
      anchorEl={anchorEl} 
      onMouseEnter={stopHover} 
      tooltip={tooltip}
      modifiers={{
        flip: {
          enabled: flip
        }
      }}
    >
      <div className={classes.tooltip}>{title}</div>
    </LWPopper>
    {children}
  </span>
}

const LWTooltipComponent = registerComponent<ExternalProps>("LWTooltip", LWTooltip, { styles });

declare global {
  interface ComponentTypes {
    LWTooltip: typeof LWTooltipComponent
  }
}

