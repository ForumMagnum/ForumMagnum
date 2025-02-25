  import React, { useEffect } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
  import {gatherTownRoomId, gatherTownRoomName} from "../../lib/publicSettings";


export const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`

const styles = (theme: ThemeType) => ({
  iframePositioning: {
    width: "100%",
    height: "100%",
    border: "none"
  },
})


const GatherTownIframeWrapper = ({iframeRef, classes}: {
  iframeRef: React.RefObject<HTMLIFrameElement>,
  classes: ClassesType<typeof styles>,
}) => {
  useEffect(() => {
    iframeRef?.current?.focus && iframeRef.current.focus()
  }, [iframeRef])

  return <iframe className={classes.iframePositioning} ref={iframeRef} src={gatherTownURL} allow={`camera ${gatherTownURL}; microphone ${gatherTownURL}; display-capture ${gatherTownURL}; transparency ${gatherTownURL}; encrypted-media ${gatherTownURL}`}></iframe>
}

const GatherTownIframeWrapperComponent = registerComponent('GatherTownIframeWrapper', GatherTownIframeWrapper, {styles});

declare global {
  interface ComponentTypes {
    GatherTownIframeWrapper: typeof GatherTownIframeWrapperComponent
  }
}
