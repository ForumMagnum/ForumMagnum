import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import {hookToHoc} from "../../lib/hocUtils";

export function useHover() {
    const [hover, setHover] = useState(true)
    const [anchorEl, setAnchorEl] = useState(null)

    const ref = useRef()

    const { captureEvent } = useTracking()

    const handleMouseOver = useCallback((event) => {
        setHover(true)
        setAnchorEl(event.currentTarget)
        console.log("mouseover triggered")
        captureEvent("hoverEventTriggered")
    },[] )

    const handleMouseLeave = useCallback(() => {
        setHover(false)
        setAnchorEl(null)
        console.log("mouseleaver triggered")
    },[])

    useEffect(() => {
            const node = ref?.current?.props.ref;
            console.log(node)
            console.log({node: ref.current})
            if (node) {
                console.log("node branch executed")
                console.log(node)
                node.addEventListener('mouseover', handleMouseOver)
                node.addEventListener('mouseleave', handleMouseLeave)
                return () => {
                    node.addEventListener('mouseover', handleMouseOver)
                    node.addEventListener('mouseleave', handleMouseLeave)
                }
            }
        },[ref])

      return { ref, hover, anchorEl, stopHover: handleMouseLeave }
}

export const withHover = hookToHoc(useHover)
export default withHover
