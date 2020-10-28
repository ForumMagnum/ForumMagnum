import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Button } from "@material-ui/core";
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
})

export const PomodoroWidget = ({classes}:{classes:ClassesType}) => {

  const [hidePomodoroTimer, setHidePomodoroTimer] = useState(true)

  return <div>
    <Typography variant="title">Shared Pomodoro Timer</Typography>
    <Button onClick={()=> setHidePomodoroTimer(!hidePomodoroTimer)}>
      <strong>{hidePomodoroTimer? "Show" : "Hide"}</strong>
    </Button>
    { !hidePomodoroTimer && <iframe className={classes.pomodoroTimerIframe} src={"https://cuckoo.team/lesswrong"}></iframe> }
  </div>
}

const PomodoroWidgetComponent = registerComponent('PomodoroWidget', PomodoroWidget, {styles});

declare global {
  interface ComponentTypes {
    PomodoroWidget: typeof PomodoroWidgetComponent
  }
}

