import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTracking } from "../../lib/analyticsEvents";

export const withHover = (WrappedComponent) => {
    return (props) => {
        const [hover, setHover] = useState(true)
        const [anchorEl, setAnchorEl] = useState(null)

        const {captureEvent} = useTracking()

        const handleMouseOver = useCallback((event) => {
            setHover(true)
            setAnchorEl(event.currentTarget)
            console.log("mouseover triggered")
            captureEvent("hoverEventTriggered")
        }, [])

        const handleMouseLeave = useCallback(() => {
            setHover(false)
            setAnchorEl(null)
            console.log("mouseleaver triggered")
        }, [])


        const allProps = {hover, anchorEl, stopHover: handleMouseLeave, ...props}

        return (
            <span onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
                <WrappedComponent { ...allProps }/>
            </span>
        )
    }
}

export default withHover
