import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  showButton: {
    paddingTop: 12,
    paddingBottom: 8,
    textAlign: "right",
    cursor: "pointer",
    "&:hover": {
      opacity: .5,
      background: "none"
    },
  },
  pomodoroTimerIframe: {
    width: "450px",
    height: "220px",
    border: 'none'
  },
  hide: {
    verticalAlign: "top",
    opacity: .5,
    padding: 10
  }
})

export const PomodoroWidget = ({classes}:{classes:ClassesType}) => {

  const [hidePomodoroTimer, setHidePomodoroTimer] = useState(true)

  return <div>
    {hidePomodoroTimer && <div>
      <div className={classes.showButton} onClick={()=> setHidePomodoroTimer(false)}>
        <i>Show Pomodoro Timer</i>
      </div>
    </div>}
    { !hidePomodoroTimer && <div>
      <span className={classes.hide} onClick={()=> setHidePomodoroTimer(true)}>
        <i>X</i>
      </span>
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

