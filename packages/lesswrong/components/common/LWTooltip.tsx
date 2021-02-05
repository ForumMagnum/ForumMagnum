import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from './withHover';
import { PopperPlacementType } from '@material-ui/core/Popper'
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
    display: "inline-block",
  },
  tooltip: {
    maxWidth: 300
  }
})

const LWTooltip = ({classes, className, children, title, placement="bottom-start", tooltip=true, flip=true, clickable=false, inlineBlock=true}: {
  children?: any,
  title?: any,
  placement?: PopperPlacementType,
  tooltip?: boolean,
  flip?: boolean,
  clickable?: boolean,
  inlineBlock?: boolean,
  classes: ClassesType,
  className?: string
}) => {
  const { LWPopper } = Components
  const { hover, everHovered, anchorEl, eventHandlers } = useHover({
    pageElementContext: "tooltipHovered",
    title: typeof title=="string" ? title : undefined
  });
  
  if (!title) return children

  return <span className={classNames({[classes.root]: inlineBlock}, className)} {...eventHandlers}>
    { /* Only render the LWPopper if this element has ever been hovered. (But
         keep it in the React tree thereafter, so it can remember its state and
         can have a closing animation if applicable. */ }
    {everHovered && <LWPopper
      placement={placement}
      open={hover}
      anchorEl={anchorEl}
      tooltip={tooltip}
      modifiers={{
        flip: {
          enabled: flip
        }
      }}
      clickable={clickable}
    >
      <div className={tooltip ? classes.tooltip : null}>{title}</div>
    </LWPopper>}
    
    {children}
  </span>
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

