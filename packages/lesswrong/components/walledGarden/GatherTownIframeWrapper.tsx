  import React, { useEffect } from 'react'
import { registerComponent} from '../../lib/vulcan-lib';
  import {gatherTownRoomId, gatherTownRoomName} from "../../lib/publicSettings";


const gatherTownLeftMenuWidth = 65 // We want to hide this menu, so we apply a negative margin on the iframe

const styles = (theme) => ({
  iframePositioning: {
    width: `calc(100% + ${gatherTownLeftMenuWidth}px)`,
    height: "100%",
    border: "none",
    marginLeft: -gatherTownLeftMenuWidth,
  },
})


const GatherTownIframeWrapper = ({iframeRef, classes}) => {

  const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`

  useEffect(() => {
    iframeRef.current.focus()
  }, [iframeRef])

  return <iframe className={classes.iframePositioning} ref={iframeRef} src={gatherTownURL} allow={`camera ${gatherTownURL}; microphone ${gatherTownURL}`}></iframe>
}

const GatherTownIframeWrapperComponent = registerComponent('GatherTownIframeWrapper', GatherTownIframeWrapper, {styles});

declare global {
  interface ComponentTypes {
    GatherTownIframeWrapper: typeof GatherTownIframeWrapperComponent
  }
}
