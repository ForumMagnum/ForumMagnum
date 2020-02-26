import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from './withHover';
import { PopperPlacementType } from '@material-ui/core/Popper'

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
  placement?: PopperPlacementType,
  tooltip?: boolean,
  flip?: boolean,
  muiClasses?: any,
  enterDelay?: number,
}
interface LWTooltipProps extends ExternalProps, WithStylesProps, WithHoverProps {
}

const LWTooltip = ({classes, children, title, placement="bottom-start", tooltip=true, flip=true, muiClasses=undefined, enterDelay=undefined}: LWTooltipProps) => {
  const { LWPopper } = Components
  const { hover, everHovered, anchorEl, stopHover, eventHandlers } = useHover({
    pageElementContext: "tooltipHovered",
    title: typeof title=="string" ? title : undefined
  });
  
  return <span className={classes.root} {...eventHandlers}>
    { /* Only render the LWPopper if this element has ever been hovered. (But
         keep it in the React tree thereafter, so it can remember its state and
         can have a closing animation if applicable. */ }
    {everHovered && <LWPopper
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
      classes={muiClasses}
      enterDelay={enterDelay}
    >
      <div className={classes.tooltip}>{title}</div>
    </LWPopper>}
    
    {children}
  </span>
}

const LWTooltipComponent = registerComponent<ExternalProps>("LWTooltip", LWTooltip, { styles });

declare global {
  interface ComponentTypes {
    LWTooltip: typeof LWTooltipComponent
  }
}

