import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  hideShowButton: {
    paddingLeft: "5px",
    paddingRight: "5px",
    paddingTop: "2px",
    paddingBottom: "2px",
    "&:hover": {
      opacity: .5,
      background: "none"
    },
  },
  pomodoroTimerIframe: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "300px",
    height: "160px",
    border: 'solid 1px rgba(0,0,0,.2)'
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
    { !hidePomodoroTimer && <iframe className={classes.pomodoroTimerIframe} src={"https://cuckoo.team/lesswrong"}></iframe> }
    { !hidePomodoroTimer && <div className={classes.hideShowButton} onClick={()=> setHidePomodoroTimer(false)}>
      <i>Hide Pomodoro Timer</i>
    </div>}
  </div>
}

const PomodoroWidgetComponent = registerComponent('PomodoroWidget', PomodoroWidget, {styles});

declare global {
  interface ComponentTypes {
    PomodoroWidget: typeof PomodoroWidgetComponent
  }
}

