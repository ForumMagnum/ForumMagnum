import React, {useState, useRef, useCallback} from 'react';
import { useTracking } from "../../lib/analyticsEvents";

export const withHover = (WrappedComponent) => {
    return (props) => {
        const [hover, setHover] = useState(true)
        const [anchorEl, setAnchorEl] = useState(null)
        const delayTimer = useRef(null)
        const [mouseOverStart, setMouseOverStart] = useState()
        const [mouseOverEnd, setMouseOverEnd] = useState()

        const { captureEvent } = useTracking({eventType:"hoverEventTriggered"})

        const captureHoverEvent  = () => {
            const currentTime = new Date()
            hover && captureEvent("hoverEventTriggered",
                {timerId: delayTimer.current,
                    timeSinceMouseOver: currentTime - mouseOverStart,
                    timeFromMouseLeave: currentTime - mouseOverEnd})}
        
        const handleMouseOver = (event) => {
            setMouseOverStart(new Date())
            setHover(true)
            setAnchorEl(event.currentTarget)
            delayTimer.current = setTimeout(captureHoverEvent,3000)
            console.log({event: "mouseEnterTriggered", timerId: delayTimer.current})
        }

        const handleMouseLeave = () => {
            setMouseOverEnd(new Date())
            console.log({event: "mouseLeaveTriggered", timerId: delayTimer.current, diff: new Date() - mouseOverStart})
            setHover(false)
            setAnchorEl(null)
            clearTimeout(delayTimer.current)
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
