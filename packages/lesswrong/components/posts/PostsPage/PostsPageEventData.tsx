import Button from '@material-ui/core/Button';
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
  },
  joinEventLink: {
    flex: 'none',
    margin: '0 24px',
    [theme.breakpoints.down('xs')]: {
      margin: '20px 0 0',
    },
  }
})

const PostsPageEventData = ({classes, post}: {
  classes: ClassesType,
  post: PostsBase,
}) => {
  const {captureEvent} = useTracking()
  
  const handleClick = () => {
    captureEvent("joinEventLinkClick")
  }
  
  const { location, contactInfo, onlineEvent, joinEventLink } = post
  
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
  
  // before the event starts, the "Join Event" button is disabled
  const inTenMinutes = moment().add(10, 'minutes')
  const beforeEvent = post.startTime && moment(post.startTime).isAfter(inTenMinutes)
  
  // if the event is over, disable the "Join Event" button and show "Event Ended"
  const now = moment()
  const twoHoursAgo = moment().subtract(2, 'hours')
  const afterEvent = (post.endTime && moment(post.endTime).isBefore(now)) ||
    (!post.endTime && post.startTime && moment(post.startTime).isBefore(twoHoursAgo))
    
  // if the event is soon/now, enable the "Join Event" button
  const duringEvent = post.startTime && !beforeEvent && !afterEvent
  
  return <Components.Typography variant="body2" className={classes.metadata}>
      <div>
        <Components.EventTime post={post} dense={false} />
        { locationNode }
        { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
      </div>
      {post.joinEventLink && post.startTime && <div className={classes.joinEventLink}>
        <Button variant="contained" color="primary" href={post.joinEventLink} disabled={!duringEvent} onClick={handleClick} target="_blank" rel="noopener noreferrer">
          {afterEvent ? 'Event Ended' : 'Join Event'}
        </Button>
      </div>}
  </Components.Typography>
}

const PostsPageEventDataComponent = registerComponent('PostsPageEventData', PostsPageEventData, {styles});

declare global {
  interface ComponentTypes {
    PostsPageEventData: typeof PostsPageEventDataComponent
  }
}
