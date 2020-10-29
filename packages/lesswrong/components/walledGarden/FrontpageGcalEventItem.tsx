import React from 'react'
import moment from 'moment';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  secondaryInfo: {
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: 'rgba(0,0,0,0.55)',
    marginTop: 8
  },
  eventTime: {
    fontSize: ".8em",
    opacity: .75
  },
})

const FrontpageGcalEventItem = ({classes, gcalEvent}) => {
  return <div className={classes.secondaryInfo}>
    <span>
          {gcalEvent.summary}{" "}
          <span className={classes.eventTime}>{moment(new Date(gcalEvent.start.dateTime)).calendar()}</span>
    </span>
  </div>
}


const FrontpageGcalEventItemComponent = registerComponent('FrontpageGcalEventItem', FrontpageGcalEventItem, {styles});

declare global {
  interface ComponentTypes {
    FrontpageGcalEventItem: typeof FrontpageGcalEventItemComponent
  }
}
