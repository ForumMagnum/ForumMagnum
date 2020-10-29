import React from 'react'
import moment from 'moment';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme) => ({
  secondaryInfo: {
    // fontSize: '1rem',
    // color: 'rgba(0,0,0,0.9)',
    // color: theme.palette.secondary.main,
    marginTop: 5
  },
  eventTime: {
    fontSize: ".9em",
    opacity: 0.8
  },
})

const PortalBarGcalEventItem = ({classes, gcalEvent}) => {

  const { LWTooltip } = Components

  return <div className={classes.secondaryInfo}>
      <span>
        <span className={classes.eventTime}>
          {moment(new Date(gcalEvent.start.dateTime)).format("M/D, dddd h:mmA")}
          {"  –  "}
        </span>
        <a href={gcalEvent.htmlLink} target="_blank" rel="noopener noreferrer">
            {gcalEvent.summary}
        </a>
      </span>
  </div>
}


const PortalBarGcalEventItemComponent = registerComponent('PortalBarGcalEventItem', PortalBarGcalEventItem, {styles});

declare global {
  interface ComponentTypes {
    PortalBarGcalEventItem: typeof PortalBarGcalEventItemComponent
  }
}
