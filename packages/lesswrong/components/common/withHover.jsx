import React, {useState, useRef, useCallback } from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import { isMobile } from '../../lib/modules/utils/isMobile.js'

export const withHover = (WrappedComponent) => {
    return (props) => {
        const [hover, setHover] = useState(false)
        const [anchorEl, setAnchorEl] = useState(null)
        const delayTimer = useRef(null)
        const mouseOverStart = useRef()
        const [hoverTrackingProps, setHoverTrackingProps] = useState()


        const captureHoverEvent = useCallback(() => {
            !isMobile() && captureEvent("hoverEventTriggered",
                {...{timeToCapture: new Date() - mouseOverStart.current}, ...hoverTrackingProps})
            clearTimeout(delayTimer.current)
        }, [captureEvent])

        const handleMouseOver = useCallback((event) => {
            setHover(true)
            setAnchorEl(event.currentTarget)
            mouseOverStart.current = new Date()
            clearTimeout(delayTimer.current)
            delayTimer.current = setTimeout(captureHoverEvent,500)
        }, [captureHoverEvent])

        const handleMouseLeave = useCallback(() => {
            setHover(false)
            setAnchorEl(null)
            clearTimeout(delayTimer.current)
            const hoverDuration = new Date() - mouseOverStart.current
            if ( hoverDuration > 2000 ) captureEvent("hoverEventTriggered",
              {hoverEventType: "longHoverEvent", hoverDuration})
            mouseOverStart.current = undefined
        },[captureEvent])


        const allProps = { hover, anchorEl, stopHover: handleMouseLeave, hoverTrackingProps, setHoverTrackingProps, ...props }

        return (
            <span onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
                <WrappedComponent { ...allProps }/>
            </span>
        )
    }
}

export default withHover
