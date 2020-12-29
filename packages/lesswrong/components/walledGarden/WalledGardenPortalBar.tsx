import React, { useRef, useEffect, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Typography } from "@material-ui/core";
import {commentBodyStyles, postBodyStyles } from "../../themes/stylePiping";
import { useCurrentUser } from '../common/withUser';
import { gatherTownURL } from "./GatherTownIframeWrapper";
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import Slider from '@material-ui/lab/Slider';
import {MAX_NOTIFICATION_RADIUS} from "../../lib/collections/users/custom_fields";

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
    flexWrap: "wrap"
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
    alignItems: "center"
  },
  muteUnmuteButton: {
    height:60,
    width: 60,
    marginRight: 10,
    opacity: 0.9
  },
  volumeSlider: {
    marginRight: 20
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
})

export const WalledGardenPortalBar = ({iframeRef, classes}:{iframeRef:React.RefObject<HTMLIFrameElement|null>, classes:ClassesType}) => {
  const { GardenCodeWidget, GardenCodesList, PomodoroWidget, } = Components

  useEffect( function(){ var centovacast = (window.centovacast||(window.centovacast={}));
      (centovacast.streaminfo||(centovacast.streaminfo={})).config = {
        poll_limit: 10000,        // specify how many times to poll the server
        poll_frequency: 3000  // specify the poll frequency in milliseconds
        };
      },
    [])
  
  const currentUser =  useCurrentUser()
  const refocusOnIframe = () => iframeRef?.current && iframeRef.current.focus()
  
  const radio = useRef(null)
  const [playing, setPlaying]  = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(1)
  
  // const originalSourceUrl = "https://us10a.serverse.com/proxy/wqpanlfq?mp=/stream"
  // const sourceElement = document.querySelector("source");
  // const audioElement = document.querySelector("audio");
  
  const playHandler = () => {
    if (radio?.current) {
      radio.current.play();
      radio.current.muted = false
      }
    // if (!sourceElement?.getAttribute("src")) {
    //   sourceElement?.setAttribute("src", originalSourceUrl);
    //   audioElement?.load(); // This restarts the stream download
    // }
    // audioElement?.play();
    setPlaying(true);
  }
  
  const pauseHandler = () => {
    if (radio?.current) {
      radio.current.muted = true
    }
    // sourceElement?.setAttribute("src", "");
    // audioElement?.pause();
    // // settimeout, otherwise pause event is not raised normally
    // setTimeout(function () {
    //   audioElement?.load(); // This stops the stream from downloading
    // });
    setPlaying(false);
  }
  
  const volumeChangeHandler = (event, newValue ) => {
    setVolumeLevel(newValue)
    if (radio?.current) {
      // radio.current.volume = newValue
    }
  }
    
  
  return <div className={classes.root}>
    <div className={classes.widgetsContainer}>
      <div className={classes.partyResources}>
      </div>
      <div className={classes.radio}>
        <audio ref={radio} muted={!playing}>
          <source src="https://us10a.serverse.com/proxy/wqpanlfq?mp=/stream" type="audio/mpeg" />
            Your browser does not support the audio element.
        </audio>
        
        <div 
          className={classes.muteUnmuteButton} 
          onClick={ ()=> { playing ? pauseHandler() : playHandler() }}
        >
          { playing ? <VolumeUpIcon className={classes.muteUnmuteButton}/> : <VolumeOffIcon className={classes.muteUnmuteButton}/>}
        </div>
        <div className={classes.volumeSlider}>
          <Slider
            // aria-orientation="vertical"
            value={volumeLevel}
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
            <span className="cc_streaminfo" data-type="song" data-username="wqpanlfq">Loading song name...</span>
          </div>
        </div>
        
  
        {/*<div*/}
        {/*  className={classes.pauseButton}*/}
        {/*  onClick={()=> {if (radio.current) radio.current.play()}}*/}
        {/*>*/}
        {/*  PLAY BUTTON*/}
        {/*</div>*/}
        
        {/*<div*/}
        {/*  className={classes.pauseButton}*/}
        {/*  onClick={()=> {if (radio.current) radio.current.pause()}}*/}
        {/*>*/}
        {/*  PAUSE BUTTON*/}
        {/*</div>*/}
        {/*<div*/}
        {/*  className={classes.pauseButton}*/}
        {/*  onClick={()=> {if (radio.current) radio.current.muted = true }}*/}
        {/*>*/}
        {/* MUTE */}
        {/*</div>*/}
        {/*<div*/}
        {/*  className={classes.pauseButton}*/}
        {/*  onClick={()=> {if (radio.current) radio.current.muted = false}}*/}
        {/*>*/}
        {/*  UNMUTE*/}
        {/*</div>*/}
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
    <script language="javascript" type="text/javascript" src="https://us10a.serverse.com:2199/system/streaminfo.js"></script>
  </div>
}

const WalledGardenPortalBarComponent = registerComponent('WalledGardenPortalBar', WalledGardenPortalBar, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortalBar: typeof WalledGardenPortalBarComponent
  }
}
