  import React, { useEffect } from 'react'
import { registerComponent} from '../../lib/vulcan-lib';
  import {gatherTownRoomId, gatherTownRoomName} from "../../lib/publicSettings";


const gatherTownLeftMenuWidth = 65 // We want to hide this menu, so we apply a negative margin on the iframe

export const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`

const styles = (theme: ThemeType): JssStyles => ({
  iframePositioning: {
    width: `calc(100% + ${gatherTownLeftMenuWidth}px)`,
    height: "100%",
    border: "none",
  },
})


const GatherTownIframeWrapper = ({iframeRef, classes}: {
  iframeRef: React.RefObject<HTMLIFrameElement>,
  classes: ClassesType,
}) => {
  useEffect(() => {
    iframeRef?.current?.focus && iframeRef.current.focus()
  }, [iframeRef])

  return <iframe className={classes.iframePositioning} ref={iframeRef} src={gatherTownURL} allow={`camera ${gatherTownURL}; microphone ${gatherTownURL}; display-capture ${gatherTownURL}`}></iframe>
}

const GatherTownIframeWrapperComponent = registerComponent('GatherTownIframeWrapper', GatherTownIframeWrapper, {styles});

declare global {
  interface ComponentTypes {
    GatherTownIframeWrapper: typeof GatherTownIframeWrapperComponent
  }
}
