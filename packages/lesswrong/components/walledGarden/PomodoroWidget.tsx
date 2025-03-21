import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import TimerIcon from '@/lib/vendor/@material-ui/icons/src/Timer';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  icon: {
    color: theme.palette.primary.main,
    marginRight: 8  
  }
})

export const PomodoroWidget = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { LWTooltip } = Components

  return <LWTooltip title="Open the Garden pomodoro timer in a separate tab">
      <div className={classes.root}>
        <TimerIcon className={classes.icon} />
        <a target="_blank" rel="noopener noreferrer" href="https://cuckoo.team/lesswrong">
          Pomodoro Timer
        </a>
      </div>
    </LWTooltip>
}

const PomodoroWidgetComponent = registerComponent('PomodoroWidget', PomodoroWidget, {styles});

declare global {
  interface ComponentTypes {
    PomodoroWidget: typeof PomodoroWidgetComponent
  }
}

