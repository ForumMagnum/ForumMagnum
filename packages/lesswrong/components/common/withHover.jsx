import React, {useState, useRef } from 'react';
import { useTracking } from "../../lib/analyticsEvents";

export const withHover = (WrappedComponent) => {
    return (props) => {
        const [hover, setHover] = useState(false)
        const [anchorEl, setAnchorEl] = useState(null)
        const delayTimer = useRef(null)
        const mouseOverStart = useRef()


        const { captureEvent } = useTracking({eventType:"hoverEventTriggered"})

        const captureHoverEvent = () => {
            captureEvent("hoverEventTriggered", {timeToCapture: new Date() - mouseOverStart.current})
            clearTimeout(delayTimer.current)
        }

        const handleMouseOver = (event) => {
            setHover(true)
            setAnchorEl(event.currentTarget)
            mouseOverStart.current = new Date()
            clearTimeout(delayTimer.current)
            delayTimer.current = setTimeout(captureHoverEvent,500)
        }

        const handleMouseLeave = () => {
            setHover(false)
            setAnchorEl(null)
            clearTimeout(delayTimer.current)
            const hoverDuration = new Date() - mouseOverStart.current
            //TODO: rename "longHoverEventTriggered -> hoverEventTriggered
            if ( hoverDuration > 2000 ) captureEvent("longHoverEventTriggered", {hoverEventType: "longHoverEvent", hoverDuration})
            mouseOverStart.current = undefined
        }


        const allProps = { hover, anchorEl, stopHover: handleMouseLeave, ...props }

        return (
            <span onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
                <WrappedComponent { ...allProps }/>
            </span>
        )
    }
}

export default withHover
