import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  hideShowButton: {
    paddingLeft: "5px",
    paddingRight: "5px",
    paddingTop: "2px",
    paddingBottom: "2px",
    width: "100%",
    textAlign: "right",
    cursor: "pointer",
    "&:hover": {
      opacity: .5,
      background: "none"
    },
  },
  timerWrapper: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  pomodoroTimerIframe: {
    width: "450px",
    height: "220px",
    border: 'none'
  },
})

export const PomodoroWidget = ({classes}:{classes:ClassesType}) => {

  const [hidePomodoroTimer, setHidePomodoroTimer] = useState(true)

  return <div>
    {hidePomodoroTimer && <div 
      className={classes.hideShowButton} 
      onClick={()=> setHidePomodoroTimer(false)}>
        <i>Show Pomodoro Timer</i>
      </div>}
    { !hidePomodoroTimer && <div className={classes.timerWrapper}>
      <div className={classes.hideShowButton} onClick={()=> setHidePomodoroTimer(true)}>
        <i>Hide Pomodoro Timer</i>
      </div>
      <iframe className={classes.pomodoroTimerIframe} src={"https://cuckoo.team/lesswrong"}/>
    </div>}
  </div>
}

const PomodoroWidgetComponent = registerComponent('PomodoroWidget', PomodoroWidget, {styles});

declare global {
  interface ComponentTypes {
    PomodoroWidget: typeof PomodoroWidgetComponent
  }
}

