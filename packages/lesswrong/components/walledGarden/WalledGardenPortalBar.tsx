import React, { useRef, useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
// import { Typography } from "@material-ui/core";
import {commentBodyStyles, postBodyStyles } from "../../themes/stylePiping";
// import { useCurrentUser } from '../common/withUser';
// import { gatherTownURL } from "./GatherTownIframeWrapper";
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import Slider from '@material-ui/lab/Slider';
// import {MAX_NOTIFICATION_RADIUS} from "../../lib/collections/users/custom_fields";

const widgetStyling = {
  marginLeft: 30,
}

const gatherTownRightSideBarWidth = 300

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...commentBodyStyles(theme, true),
    padding: 16,
    marginBottom: 0,
    marginTop: 0,
    position: "relative",
  },
  widgetsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  portalBarButton: {
    position: "relative",
    left: `calc((100vw - ${gatherTownRightSideBarWidth}px)/2)`,
    "&:hover": {
      opacity: .5,
      background: "none"
    },
  },
  gardenCodeWidget: {
    ...widgetStyling
  },
  eventWidget: {
    width: 400,
    ...widgetStyling
  },
  pomodoroTimerWidget: {
    ...widgetStyling
  },
  codesList: {
    marginLeft: 60
  },
  calendarLinks: {
    fontSize: ".8em",
    marginTop: "3px"
  },
  events: {
    marginRight: 60
  },
  fbEventButton: {
    width: 135
  },
  textButton: {
    marginRight: 16,
    fontSize: "1rem",
    fontStyle: "italic"
  },
  calendars: {
    marginLeft: 60
  },
  link: {
    marginRight: 16,
    fontSize: "1rem",
    fontStyle: "italic",
    '& a': {
      color: theme.palette.grey[500]
    }
  },
  radio: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20
  },
  muteUnmuteButton: {
    height:60,
    width: 60,
    marginRight: 10,
    opacity: 0.9
  },
  volumeSlider: {
    marginRight: 20,
    height: '100%'
  },
  radioText: {
    display: "flex",
    flexDirection: "column"
  },
  radioTitle: {
    ...postBodyStyles(theme),
    fontSize: "2rem"
  },
  nowPlaying: {
    fontVariant: "all-petite-caps",
    fontSize: "1.4rem"
  },
  sliderTrack: {
    backgroundColor: 'black'
  },
  sliderThumb: {
    backgroundColor: 'black'
  }
})



export const WalledGardenPortalBar = ({iframeRef, classes}:{iframeRef:React.RefObject<HTMLIFrameElement|null>, classes:ClassesType}) => {
  // const { GardenCodeWidget, GardenCodesList, PomodoroWidget, } = Components
  const [songTitle, setSongTitle] = useState("Loading...")
  const sourceElement = useRef<HTMLSourceElement>(null)
  const audioElement = useRef<HTMLAudioElement>(null)

  const queryRecentTracks = async  () => {
    const truncatedTimestamp = `${new Date().getTime()}`.slice(-6)
    const songTitleResponse = await fetch(`https://us10a.serverse.com:2199/external/rpc.php?m=recenttracks.get&username=wqpanlfq&rid=wqpanlfq&_=1609325202167&cab=${truncatedTimestamp}`, {
      "headers": {
        "accept": "*/*",
      },
      "body": null,
      "method": "GET",
      "mode": "cors",
    });
    const json = await songTitleResponse.json()
    const recentTracksData = json?.data || []
    const songData = recentTracksData[0][0]
    const songDetails = `${songData['artist']} – ${songData['title']}` //JSON has these fields swapped
    setSongTitle(songDetails)
  }

  useEffect(() => {
    const interval = setInterval(queryRecentTracks, 1000)
    return () => clearInterval(interval)
  } ,[])
  
  // const currentUser =  useCurrentUser()
  // const refocusOnIframe = () => iframeRef?.current && iframeRef.current.focus()
  
  const [playing, setPlaying]  = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(1)
  
  const originalSourceUrl = "https://us10a.serverse.com/proxy/wqpanlfq?mp=/stream"

  const playHandler = () => {
    if (!sourceElement.current?.getAttribute("src")) {
      sourceElement.current?.setAttribute("src", originalSourceUrl);
      audioElement.current?.load(); // This restarts the stream download
    }
    audioElement.current?.play();
    setPlaying(true);
  }
  
  const pauseHandler = () => {
    sourceElement.current?.setAttribute("src", "");
    audioElement.current?.pause();
    // settimeout, otherwise pause event is not raised normally
    setTimeout(function () {
      audioElement.current?.load(); // This stops the stream from downloading
    });
    setPlaying(false);
  }
  
  const volumeChangeHandler = (event, newValue ) => {
    setVolumeLevel(newValue)
    if (audioElement?.current) {
      audioElement.current.volume = newValue
    }
  }  
  
  return <div className={classes.root}>
    <div className={classes.widgetsContainer}>
      <div className={classes.partyResources}>
      </div>
      <div className={classes.radio}>
        <audio ref={audioElement} muted={!playing} id="walledGardenAudio">
          <source src="https://us10a.serverse.com/proxy/wqpanlfq?mp=/stream" type="audio/mpeg" id="walledGardenSource" ref={sourceElement} />
            Your browser does not support the audio element.
        </audio>
        <div 
          className={classes.muteUnmuteButton} 
          onClick={ ()=> { playing ? pauseHandler() : playHandler() }}
        >
          { playing ? <StopIcon className={classes.muteUnmuteButton}/> : <PlayArrowIcon className={classes.muteUnmuteButton}/>}
        </div>
        <div className={classes.volumeSlider}>
          <Slider
            classes={{track: classes.sliderTrack, thumb: classes.sliderThumb}}
            value={volumeLevel || 0}
            step={0.05}
            min={0}
            max={1}
            onChange={volumeChangeHandler}
            vertical
          />
        </div>
        
        <div className={classes.radioText}>
          <div>
            <span className={classes.radioTitle}>NYE Ultra Party Radio</span>
          </div>
          <div className={classes.nowPlaying}>
            {songTitle}
          </div>
        </div>
      </div>
      {/*{currentUser?.walledGardenInvite && <div className={classes.events}>*/}
      {/*  <Typography variant="title">Garden Events</Typography>*/}
      {/*  <div className={classes.calendarLinks}>*/}
      {/*    <div><GardenCodeWidget type="friend"/></div>*/}
      {/*    <div><GardenCodeWidget type="event"/></div>*/}
      {/*  </div>*/}
      {/*</div>}*/}
      {/*<div className={classes.eventWidget}>*/}
      {/*  <GardenCodesList terms={{view: "semipublicGardenCodes", types:  currentUser?.walledGardenInvite ? ['public', 'semi-public'] : ['public']}}/>*/}
      {/*  {currentUser?.walledGardenInvite &&   <GardenCodesList terms={{view: "usersPrivateGardenCodes"}}/>}*/}
      {/*</div>*/}
      {/*{currentUser?.walledGardenInvite && <div className={classes.calendars}>*/}
      {/*  <div className={classes.textButton}>*/}
      {/*    <a href={"https://www.facebook.com/groups/356586692361618/events"} target="_blank" rel="noopener noreferrer">*/}
      {/*      Facebook Group*/}
      {/*    </a>*/}
      {/*  </div>*/}
      {/*  <div className={classes.link}>*/}
      {/*    <a href={gatherTownURL} rel="noopener noreferrer">*/}
      {/*      Backup GatherTown Link*/}
      {/*    </a>*/}
      {/*  </div>*/}
      {/*</div>}*/}
      {/*<div className={classes.pomodoroTimerWidget} onClick={() => refocusOnIframe()}>*/}
      {/*  <PomodoroWidget />*/}
      {/*</div>*/}
    </div>
    
  </div>
}

const WalledGardenPortalBarComponent = registerComponent('WalledGardenPortalBar', WalledGardenPortalBar, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortalBar: typeof WalledGardenPortalBarComponent
  }
}
