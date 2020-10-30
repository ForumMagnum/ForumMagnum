import React from 'react'
import moment from 'moment';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  root: {
    ...theme.typography.commentStyle,
    fontSize: '1.1rem',
    color: 'rgba(0,0,0,0.55)',
    display: "flex",
    justifyContent: "space-between"
  },
  eventTime: {
    fontSize: ".9em",
    opacity: .75,
    width: 120,
    display: "inline-block"
  },
})

const PortalBarGcalEventItem = ({classes, gcalEvent}) => {
  const { LWTooltip } = Components
  return <div className={classes.root}>
      <a href={gcalEvent.htmlLink} target="_blank" rel="noopener noreferrer">
          {gcalEvent.summary}
      </a>{" "}
      <span className={classes.eventTime}>
        {moment(new Date(gcalEvent.start.dateTime)).format("ddd h:mma, M/D")}
      </span>
    </div>
}


const PortalBarGcalEventItemComponent = registerComponent('PortalBarGcalEventItem', PortalBarGcalEventItem, {styles});

declare global {
  interface ComponentTypes {
    PortalBarGcalEventItem: typeof PortalBarGcalEventItemComponent
  }
}
