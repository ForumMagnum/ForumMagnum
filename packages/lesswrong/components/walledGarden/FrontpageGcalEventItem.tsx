import React from 'react'
import moment from 'moment';
import { registerComponent } from '../../lib/vulcan-lib';
import { getAddToCalendarLink } from './PortalBarGcalEventItem'

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    color: theme.palette.text.dim55,
  },
  eventTime: {
    fontSize: ".8em",
    opacity: .75
  },
})

const FrontpageGcalEventItem = ({classes, gcalEvent}: {
  classes: ClassesType<typeof styles>,
  gcalEvent: any,
}) => {
  return <div className={classes.root}>
    {getAddToCalendarLink(gcalEvent)} <span className={classes.eventTime}>
      {moment(new Date(gcalEvent.start.dateTime)).calendar()}
    </span>
  </div>
}


const FrontpageGcalEventItemComponent = registerComponent('FrontpageGcalEventItem', FrontpageGcalEventItem, {styles});

declare global {
  interface ComponentTypes {
    FrontpageGcalEventItem: typeof FrontpageGcalEventItemComponent
  }
}
