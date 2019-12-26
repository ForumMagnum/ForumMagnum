import React, {useState, useRef, useCallback} from 'react';
import { useTracking } from "../../lib/analyticsEvents";

export const withHover = (WrappedComponent) => {
    return (props) => {
        const [hover, setHover] = useState(true)
        const [anchorEl, setAnchorEl] = useState(null)
        const delayTimer = useRef(null)
        const mouseOverStart = useRef()
        const mouseOverEnd = useRef()


        const { captureEvent } = useTracking({eventType:"hoverEventTriggered"})

        const captureHoverEvent = useCallback(() => {
            captureEvent("hoverEventTriggered",
                {hover,
                    timerId: delayTimer.current,
                    // mouseOverStart: mouseOverStart.current,
                    // mouseOverEnd: mouseOverEnd.current,
                    hoverDuration: mouseOverEnd.current - mouseOverStart.current,
                timeToCapture: new Date() - mouseOverStart.current})
            clearTimeout(delayTimer.current)
        },[hover, delayTimer, mouseOverStart, mouseOverEnd])

        const handleMouseOver = useCallback((event) => {
            setHover(true)
            setAnchorEl(event.currentTarget)
            mouseOverEnd.current = undefined
            mouseOverStart.current = new Date()
            clearTimeout(delayTimer.current)
            delayTimer.current = setTimeout(captureHoverEvent,500)
            console.log({event: "mouseEnterTriggered", timerId: delayTimer.current})
        }, [delayTimer, captureHoverEvent])

        const handleMouseLeave = useCallback(() => {
            setHover(false)
            setAnchorEl(null)
            clearTimeout(delayTimer.current)
            mouseOverEnd.current = new Date()
            const hoverDuration = mouseOverEnd.current - mouseOverStart.current
            console.log({event: "mouseLeaveTriggered", timerId: delayTimer.current,
                // mouseOverStart: mouseOverStart.current,
                // mouseOverEnd: mouseOverEnd.current,
                hoverDuration})
            delayTimer.current = null
            if ( hoverDuration > 1000 ) captureEvent("longHoverEventComplete", {hoverDuration})
            mouseOverStart.current = undefined
        }, [delayTimer, mouseOverStart])


        const allProps = { hover, anchorEl, stopHover: handleMouseLeave, ...props }

        return (
            <span onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
                <WrappedComponent { ...allProps }/>
            </span>
        )
    }
}

export default withHover
