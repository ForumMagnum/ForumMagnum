import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import TimerIcon from '@material-ui/icons/Timer';

const styles = (theme) => ({
  root: {
    padding: 16,
    display: "flex",
    alignItems: "center"
  },
  icon: {
    color: theme.palette.primary.main,
    marginRight: 8  
  }
})

export const PomodoroWidget = ({classes}:{classes:ClassesType}) => {
  const { LWTooltip } = Components

  return <LWTooltip title="Open the Garden pomodoro timer in a separate tab">
      <div className={classes.root}>
        <TimerIcon className={classes.icon} />
        <a target="_blank" href="https://cuckoo.team/lesswrong">Open Pomodoro Timer</a>
      </div>
    </LWTooltip>
}

const PomodoroWidgetComponent = registerComponent('PomodoroWidget', PomodoroWidget, {styles});

declare global {
  interface ComponentTypes {
    PomodoroWidget: typeof PomodoroWidgetComponent
  }
}

