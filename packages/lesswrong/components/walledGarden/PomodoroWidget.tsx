import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  hideShowButton: {
    paddingLeft: "5px",
    paddingRight: "5px",
    paddingTop: "2px",
    paddingBottom: "2px",
    cursor: "pointer",
    "&:hover": {
      opacity: .5,
      background: "none"
    },
  },
  pomodoroTimerIframe: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "450px",
    height: "220px",
    border: 'none'
  },
})

export const PomodoroWidget = ({classes}:{classes:ClassesType}) => {

  const [hidePomodoroTimer, setHidePomodoroTimer] = useState(true)

  return <div>
    {hidePomodoroTimer && <div className={classes.pomodoroTimerIframe} onClick={()=> setHidePomodoroTimer(!hidePomodoroTimer)}>
      <div className={classes.hideShowButton} onClick={()=> setHidePomodoroTimer(false)}>
        <i>Show Pomodoro Timer</i>
      </div>
    </div>}
    { !hidePomodoroTimer && <div>
      <iframe className={classes.pomodoroTimerIframe} src={"https://cuckoo.team/lesswrong"}/>
      <div className={classes.hideShowButton} onClick={()=> setHidePomodoroTimer(true)}>
        <i>Hide Pomodoro Timer</i>
      </div>
    </div>}
  </div>
}

const PomodoroWidgetComponent = registerComponent('PomodoroWidget', PomodoroWidget, {styles});

declare global {
  interface ComponentTypes {
    PomodoroWidget: typeof PomodoroWidgetComponent
  }
}

