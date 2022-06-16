import classNames from 'classnames';
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useHover } from './withHover';

const styles = (theme: ThemeType): JssStyles => ({
    root: {
      // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
      display: "inline-block",
    },
    newFeatureHandle: {
      background: theme.palette.lwTertiary.main,
      width: 10,
      height: 10,
      borderRadius: '50%',
      alignSelf: 'center',
      position: 'absolute'
    },
    NewFeatureTooltipArrow: {
      pointerEvents: "none",
      content:'""',
      position: "absolute",
      left: -10,
      top: -5,
      width: 0,
      height: 0,
      border: "10px solid transparent",
      borderRightColor: theme.palette.lwTertiary.main
    },
    NewFeatureTooltip: {
      background: theme.palette.lwTertiary.main,
      color: theme.palette.primary.contrastText,
      padding: 3,
      borderRadius: 2,
      width: 100,
      marginLeft: 10,
      marginTop: -10,
      minHeight: 40
    },
    wrapper: {
      display: 'flex',
      position: 'relative'
    }
  })
/**
 * 
 * @param props 
 * @returns 
 */
const NewFeatureTooltip = ({classes, children, className, text} :
  { classes : ClassesType, 
    children: any, 
    /**
     * Test
     */
    className?: string,
    text: string
  }) => {

  const {LWPopper} = Components
  const { anchorEl, hover, eventHandlers } = useHover();

  return <div className={classes.wrapper}>
    <LWPopper
    
    open={hover}
    anchorEl={anchorEl}
    placement="right-start"
    allowOverflow>
      <div>
        <div className={classes.NewFeatureTooltipArrow}></div>
        <div className={classes.NewFeatureTooltip}>{text}</div>
      </div>
    </LWPopper>
      {children}
    <span className={classNames(classes.newFeatureHandle, className)} {...eventHandlers}/>
  </div>
}


const LWTooltipComponent = registerComponent("NewFeatureTooltip", NewFeatureTooltip, {
  styles,
  stylePriority: -1
});

declare global {
  interface ComponentTypes {
    NewFeatureTooltip: typeof LWTooltipComponent
  }
}
