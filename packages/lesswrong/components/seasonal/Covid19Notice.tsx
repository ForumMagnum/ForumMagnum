import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: "#ffe5b4",
    border: "1px solid #888",
    borderRadius: 15,
    margin: 16,
    padding: 16,
    ...theme.typography.body2,
  }
});

const Covid19Notice = ({ classes }: {
  classes: ClassesType
}) => {
  return <div className={classes.root}>
    Check the number of COVID-19 cases in your area before hosting or attending in-person events.
    Do not host or attend gatherings in places where COVID-19 is widespread. In places where
    COVID-19 is not yet widespread, turn away attendees who are coughing or have a fever, and
    encourage attendees to wash their hands frequently.
  </div>
}


const Covid19NoticeComponent = registerComponent('Covid19Notice', Covid19Notice, {styles});

declare global {
  interface ComponentTypes {
    Covid19Notice: typeof Covid19NoticeComponent
  }
}
