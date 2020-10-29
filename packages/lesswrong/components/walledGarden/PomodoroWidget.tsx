import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { Button } from "@material-ui/core";
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  pomodoroWidgetHeader: {
    display: "flex",
    alignItems: 'center'
  },
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
    width: "450px",
    height: "230px",
    marginTop: "5px",
    paddingRight: 20,
    border: 'none'
  },
})

export const PomodoroWidget = ({classes}:{classes:ClassesType}) => {

  const [hidePomodoroTimer, setHidePomodoroTimer] = useState(true)

  return <div>
    <div className={classes.pomodoroWidgetHeader}>
      <Typography variant="title">Shared Pomodoro Timer</Typography>
      <span className={classes.hideShowButton} onClick={()=> setHidePomodoroTimer(!hidePomodoroTimer)}>
        <i>{hidePomodoroTimer? "Show" : "Hide"}</i>
      </span>
    </div>
    { !hidePomodoroTimer && <iframe className={classes.pomodoroTimerIframe} src={"https://cuckoo.team/lesswrong"}></iframe> }
  </div>
}

const PomodoroWidgetComponent = registerComponent('PomodoroWidget', PomodoroWidget, {styles});

declare global {
  interface ComponentTypes {
    PomodoroWidget: typeof PomodoroWidgetComponent
  }
}

