import Button from '@material-ui/core/Button';
import OpenInNew from '@material-ui/icons/OpenInNew';
import moment from '../../../lib/moment-timezone';
import React from 'react'
import { useTracking } from '../../../lib/analyticsEvents';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  metadata: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing.unit*2,
    ...theme.typography.postStyle,
    color: 'rgba(0,0,0,0.5)',
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  onlineEventLocation: {
    display: 'block',
    maxWidth: 400,
    color: theme.palette.primary.main,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  eventCTA: {
    flex: 'none',
    margin: '0 24px',
    [theme.breakpoints.down('xs')]: {
      margin: '20px 0 0 12px',
    },
  },
  registerBtnIcon: {
    fontSize: 15,
    marginTop: -4,
    marginLeft: 6
  }
})

const PostsPageEventData = ({classes, post}: {
  classes: ClassesType,
  post: PostsBase,
}) => {
  const {captureEvent} = useTracking()
  
  const { location, contactInfo, onlineEvent, eventRegistrationLink, joinEventLink } = post
  
  // event location - for online events, attempt to show the meeting link
  let locationNode = location && <div>{location}</div>
  if (onlineEvent) {
    locationNode = joinEventLink ? <a
      className={classes.onlineEventLocation}
      href={joinEventLink}
      title={joinEventLink}
      target="_blank" rel="noopener noreferrer">
        {joinEventLink}
    </a> : <div>Online Event</div>
  }
  
  // determine if it's currently before, during, or after the event
  const inTenMinutes = moment().add(10, 'minutes')
  const beforeEvent = post.startTime && moment(post.startTime).isAfter(inTenMinutes)
  
  const now = moment()
  const twoHoursAgo = moment().subtract(2, 'hours')
  const afterEvent = (post.endTime && moment(post.endTime).isBefore(now)) ||
    (!post.endTime && post.startTime && moment(post.startTime).isBefore(twoHoursAgo))

  const duringEvent = post.startTime && !beforeEvent && !afterEvent

  // before the event starts, the "Join Event" button is disabled
  let eventCTA = joinEventLink && <Button variant="contained" color="primary" href={joinEventLink} disabled>
    Join Event
  </Button>
  
  // if the event has a registration link, display that instead
  if (beforeEvent && eventRegistrationLink) {
    eventCTA = <Button variant="contained" color="primary" href={eventRegistrationLink} onClick={() => captureEvent("eventRegistrationLinkClick")} target="_blank" rel="noopener noreferrer">
      Register <OpenInNew className={classes.registerBtnIcon} />
    </Button>
  }
  // if the event is soon/now, enable the "Join Event" button
  else if (duringEvent) {
    eventCTA = joinEventLink && <Button variant="contained" color="primary" href={joinEventLink} onClick={() => captureEvent("joinEventLinkClick")} target="_blank" rel="noopener noreferrer">
      Join Event
    </Button>
  }
  // if the event is over, disable the "Join Event" button and show "Event Ended"
  else if (afterEvent) {
    eventCTA = joinEventLink && <Button variant="contained" color="primary" href={joinEventLink} disabled>
      Event Ended
    </Button>
  }
  
  return <Components.Typography variant="body2" className={classes.metadata}>
      <div>
        <Components.EventTime post={post} dense={false} />
        { locationNode }
        { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
      </div>
      {eventCTA && post.startTime && <div className={classes.eventCTA}>
        {eventCTA}
      </div>}
  </Components.Typography>
}

const PostsPageEventDataComponent = registerComponent('PostsPageEventData', PostsPageEventData, {styles});

declare global {
  interface ComponentTypes {
    PostsPageEventData: typeof PostsPageEventDataComponent
  }
}
