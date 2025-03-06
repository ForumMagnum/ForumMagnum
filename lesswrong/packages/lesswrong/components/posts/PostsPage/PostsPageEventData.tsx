import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import WebIcon from '@material-ui/icons/Web';
import ForumIcon from '@material-ui/icons/Forum';
import CreateIcon from '@material-ui/icons/Create';
import PeopleIcon from '@material-ui/icons/People';
import LaptopIcon from '@material-ui/icons/LaptopMac';
import ViewListIcon from '@material-ui/icons/ViewList';
import ClockIcon from '@material-ui/icons/AccessTime';
import LocationIcon from '@material-ui/icons/LocationOn'
import MailIcon from '@material-ui/icons/MailOutline'
import LocalActivityIcon from '@material-ui/icons/LocalActivity';
import moment from '../../../lib/moment-timezone';
import React from 'react'
import { useTracking } from '../../../lib/analyticsEvents';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import { Typography } from "@/components/common/Typography";
import SmallMapPreview from "@/components/localGroups/SmallMapPreview";
import EventTime from "@/components/localGroups/EventTime";
import { Button } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  metadata: {
    display: 'flex',
    ...theme.typography.postStyle,
    justifyContent: 'space-between',
    marginTop: theme.spacing.unit*2,
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down('xs')]: {
      display: 'block',
    },
  },
  iconRow: {
    display: 'flex',
    columnGap: 8,
  },
  iconWrapper: {
    paddingTop: isFriendlyUI ? 3 : 2
  },
  icon: {
    fontSize: 16,
  },
  location: {
    color: theme.palette.primary.main
  },
  onlineEventLocation: {
    display: 'block',
    maxWidth: 400,
    color: theme.palette.primary.main,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  eventType: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.eventType,
    fontSize: 12,
    letterSpacing: 0.2,
    marginTop: 12
  },
  eventTypeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  inPersonEventCTA: {
    marginTop: 20
  },
  onlineEventCTA: {
    flex: 'none',
    margin: '0 24px',
    [theme.breakpoints.down('xs')]: {
      margin: '20px 0 0 12px',
    },
  },
  externalEventPageBtn: {
    textTransform: 'none',
    fontSize: 12
  },
  externalEventPageBtnIcon: {
    fontSize: 15,
    marginLeft: 6
  },
  registerBtnIcon: {
    fontSize: 15,
    marginTop: -2,
    marginLeft: 6
  },
  mapbox: {
    flex: 'none',
    width: 300,
    marginLeft: 10,
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
      marginTop: 20
    },
  },
})

const PostsPageEventData = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
}) => {
  const now = moment(useCurrentTime())
  const {captureEvent} = useTracking()
  
  const { location, contactInfo, onlineEvent, eventRegistrationLink, joinEventLink, eventType } = post
  
  // event location - for online events, attempt to show the meeting link
  let locationNode = location && <div>
    <a className={classes.location} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}>
      {location}
    </a>
  </div>
  if (onlineEvent) {
    locationNode = joinEventLink ? <a
      className={classes.onlineEventLocation}
      href={joinEventLink}
      title={joinEventLink}
      target="_blank" rel="noopener noreferrer">
        {joinEventLink}
    </a> : <div>Online Event</div>
  }
  
  // if this event was labelled with an event type, display it
  const eventTypeIcons = {
    presentation: WebIcon,
    discussion: ForumIcon,
    workshop: CreateIcon,
    social: PeopleIcon,
    coworking: LaptopIcon,
    course: ViewListIcon,
    conference: LocalActivityIcon
  }

  type EventTypeIcons = typeof eventTypeIcons;

  const eventTypeNode = (Icon: EventTypeIcons[keyof EventTypeIcons], text: string) => <div className={classes.eventType}>
    <Icon className={classes.eventTypeIcon} /> {text.toUpperCase()}
  </div>
  
  // determine if it's currently before, during, or after the event
  const inTenMinutes = now.add(10, 'minutes')
  const beforeEvent = post.startTime && moment(post.startTime).isAfter(inTenMinutes)
  
  const twoHoursAgo = now.subtract(2, 'hours')
  const afterEvent = (post.endTime && moment(post.endTime).isBefore(now)) ||
    (!post.endTime && post.startTime && moment(post.startTime).isBefore(twoHoursAgo))

  const duringEvent = post.startTime && !beforeEvent && !afterEvent

  // before the event starts, the "Join Event" button is disabled
  let eventCTA = joinEventLink && <Button variant="contained" color="primary" href={joinEventLink} disabled>
    Join Event
  </Button>
  
  // if the event has a registration link, display that instead
  if (beforeEvent && eventRegistrationLink) {
    eventCTA = <Button
      variant="contained" color="primary"
      href={eventRegistrationLink}
      onClick={() => captureEvent("eventRegistrationLinkClick")}
      target="_blank" rel="noopener noreferrer"
    >
      Register <OpenInNewIcon className={classes.registerBtnIcon} />
    </Button>
  }
  // if the event is soon/now, enable the "Join Event" button
  else if (duringEvent) {
    eventCTA = joinEventLink && <Button
      variant="contained" color="primary"
      href={joinEventLink}
      onClick={() => captureEvent("joinEventLinkClick")}
      target="_blank" rel="noopener noreferrer"
    >
      Join Event
    </Button>
  }
  // if the event is over, disable the "Join Event" button and show "Event Ended"
  else if (afterEvent) {
    eventCTA = joinEventLink && <Button variant="contained" color="primary" href={joinEventLink} disabled>
      Event Ended
    </Button>
  }
  
  // if we have no other CTA, then link to the FB or Meetup event page
  if (!eventCTA && post.facebookLink) {
    eventCTA = <Button
      variant={afterEvent ? "outlined" : "contained"} color="primary"
      href={post.facebookLink}
      onClick={() => captureEvent("facebookEventBtnClick")}
      target="_blank" rel="noopener noreferrer"
      className={classes.externalEventPageBtn}
    >
      See event on Facebook <OpenInNewIcon className={classes.externalEventPageBtnIcon} />
    </Button>
  } else if (!eventCTA && post.meetupLink) {
    eventCTA = <Button
      variant={afterEvent ? "outlined" : "contained"} color="primary"
      href={post.meetupLink}
      onClick={() => captureEvent("meetupEventBtnClick")}
      target="_blank" rel="noopener noreferrer"
      className={classes.externalEventPageBtn}
    >
      See event on Meetup <OpenInNewIcon className={classes.externalEventPageBtnIcon} />
    </Button>
  }
  
  return <Typography variant="body2" className={classes.metadata}>
      <div>
        <div className={classes.iconRow}>
          <div className={classes.iconWrapper}><ClockIcon className={classes.icon} /></div>
          <EventTime post={post} dense={false} />
        </div>
        <div className={classes.iconRow}>
          <div className={classes.iconWrapper}><LocationIcon className={classes.icon} /></div>
          {locationNode}
        </div>
        {contactInfo && <div className={classes.iconRow}>
          <div className={classes.iconWrapper}><MailIcon className={classes.icon} /></div>
          <div>{contactInfo}</div>
        </div>}
        
        { eventType && (eventType in eventTypeIcons) && eventTypeNode(eventTypeIcons[eventType as keyof EventTypeIcons], eventType) }
        {eventCTA && post.startTime && !post.onlineEvent && <div className={classes.inPersonEventCTA}>
          {eventCTA}
        </div>}
      </div>
      {eventCTA && post.startTime && post.onlineEvent && <div className={classes.onlineEventCTA}>
        {eventCTA}
      </div>}
      {!post.onlineEvent && <div className={classes.mapbox}>
        <SmallMapPreview post={post} />
      </div>}
  </Typography>
}

const PostsPageEventDataComponent = registerComponent('PostsPageEventData', PostsPageEventData, {styles});

declare global {
  interface ComponentTypes {
    PostsPageEventData: typeof PostsPageEventDataComponent
  }
}

export default PostsPageEventDataComponent;
