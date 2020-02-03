import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withHover from './withHover';

const styles = theme => ({
  root: {
    // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
    display: "inline-block"
  }
})

interface ExternalProps {
  children?: any,
  title?: any,
  placement?: string,
  tooltip?: boolean,
  flip?: boolean,
}
interface LWTooltipProps extends ExternalProps, WithStylesProps, WithHoverProps {
}

const LWTooltip = ({classes, children, title, placement="bottom-start", hover, anchorEl, stopHover, tooltip=true, flip=true}: LWTooltipProps) => {
  const { LWPopper } = Components
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
      {title}
    </LWPopper>
    {children}
  </span>
}

const LWTooltipComponent = registerComponent<ExternalProps>("LWTooltip", LWTooltip, {
  styles,
  hocs: [
    withHover({pageElementContext: "tooltipHovered"}, ({title}) => ({title})),
  ]
});

declare global {
  interface ComponentTypes {
    LWTooltip: typeof LWTooltipComponent
  }
}


