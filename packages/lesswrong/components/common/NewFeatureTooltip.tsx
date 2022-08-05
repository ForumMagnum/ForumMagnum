import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
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
      position: 'absolute',
      cursor: 'pointer'
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
      padding: 5,
      paddingRight: 12,
      borderRadius: 2,
      width: 100,
      marginLeft: 10,
      marginTop: -10,
      minHeight: 40
    },
    closeButton: {cursor: 'pointer', position:'absolute', top:-10, right:1},
    wrapper: {
      display: 'flex',
      position: 'relative'
    }
  })



const useTooltipToggle = () => {
  const tooltipRef = useRef(null)
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState();
  /**
   * Hook that alerts clicks outside of the passed ref
   */
  function useOutsideAlerter(ref, anchorEl) {
    useEffect(() => {
      /**
       * Alert if clicked on outside of element
       */
      function handleClickOutside(event) {
        if (ref.current && !ref.current.contains(event.target) && anchorEl && !anchorEl.contains(event.target)) {
          setOpen(false)
        }
      }
      // Bind the event listener
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, anchorEl]);
  }

  useOutsideAlerter(tooltipRef, anchorEl)

  const closeEvents = {onClick : () => {
    setOpen(false)
  }}

  const handleEvents = {onClick: (e) => {
    setOpen(open => !open)
    setAnchorEl(e.target);
  }}

  return {tooltipRef, anchorEl, open, closeEvents, handleEvents}

}

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
  //const { anchorEl, hover, eventHandlers } = useHover();
  const {tooltipRef, anchorEl, open, closeEvents, handleEvents} = useTooltipToggle()

  return <div className={classes.wrapper}>
    <LWPopper
    open={open}
    anchorEl={anchorEl}
    placement="right-start"
    allowOverflow>
      <div ref={tooltipRef}>
        <div className={classes.NewFeatureTooltipArrow}></div>
        <div className={classes.NewFeatureTooltip}>{text}
        <div {...closeEvents} className={classes.closeButton}>&#x2715;</div> 
        </div>
      </div>
    </LWPopper>
      {children}
    <span className={classNames(classes.newFeatureHandle, className)} {...handleEvents}/>
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
