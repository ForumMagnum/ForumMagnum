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
  
  const { location, contactInfo, onlineEvent } = post
  
  const locationNode = onlineEvent ? (
    <div className={classes.eventLocation}>Online Event</div>
  ) : (location && <div className={classes.eventLocation}> {location} </div>);
  
  // if the event is soon/now, make the "Join Event" button more prominent
  const inTenMinutes = moment().add(10, 'minutes')
  const buttonVariant = post.startTime && moment(post.startTime).isBefore(inTenMinutes) ? 'contained' : 'outlined';
  
  // if the event is over, disable the "Join Event" button
  const now = moment()
  const twoHoursAgo = moment().subtract(2, 'hours')
  const eventEnded = (post.endTime && moment(post.endTime).isBefore(now)) ||
    (!post.endTime && post.startTime && moment(post.startTime).isBefore(twoHoursAgo))
  
  return <Components.Typography variant="body2" className={classes.metadata}>
      <div>
        <Components.EventTime post={post} dense={false} />
        { locationNode }
        { contactInfo && <div className={classes.eventContact}> Contact: {contactInfo} </div> }
      </div>
      {post.joinEventLink && (post.startTime || post.endTime) && <div className={classes.joinEventLink}>
        <Button variant={buttonVariant} color="primary" href={post.joinEventLink} title={post.joinEventLink} disabled={!!eventEnded} onClick={handleClick} target="_blank" rel="noopener">
          {eventEnded ? 'Event Ended' : 'Join Event'}
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
