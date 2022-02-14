import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { prettyEventDateTimes } from '../../../lib/collections/posts/helpers';
import { useTimezone } from '../../common/withTimezone';
import { forumTypeSetting } from '../../../lib/instanceSettings';
import { getDefaultEventImg } from './HighlightedEventCard';
import classNames from 'classnames';
import moment from 'moment';
import { useTracking } from '../../../lib/analyticsEvents';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  noResults: {
    ...theme.typography.commentStyle,
    gridColumn: '1 / 4',
    textAlign: 'center',
    fontSize: 18,
  },
  noResultsText: {
    marginTop: 10
  },
  noResultsCTA: {
    fontSize: 14,
    marginTop: 20
  },
  communityLink: {
    color: theme.palette.primary.main,
  },
  eventCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 373px)',
    gridGap: '20px',
    justifyContent: 'center',
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(2, 373px)',
    },
    '@media (max-width: 812px)': {
      gridTemplateColumns: 'auto',
    }
  },
  eventCard: {
    position: 'relative',
    width: 373,
    height: 374,
    borderRadius: 0,
    overflow: 'visible',
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    [theme.breakpoints.down('xs')]: {
      maxWidth: '100vw'
    }
  },
  specialEventCardLink: {
    '&:hover': {
      opacity: '0.9'
    }
  },
  specialEventCard: {
    background: "linear-gradient(rgba(0, 87, 102, 0.7), rgba(0, 87, 102, 0.7)), url('https://res.cloudinary.com/cea/image/upload/w_374,h_373,c_fill/Event/pz3xmsm63xl8thlyt2up.jpg')",
    padding: '50px 24px',
    '& div': {
      color: 'white'
    },
    '& .EventCards-eventCardTitle': {
      fontSize: 24
    },
    '& .EventCards-eventCardLocation': {
      opacity: '0.7'
    },
    '&:hover .EventCards-eventCardDeadline': {
      borderBottom: '2px solid white'
    }
  },
  eventCardContent: {
    position: 'relative',
    height: 170,
  },
  eventCardTime: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.primary.main
  },
  eventCardTimeApply: {
    color: "rgba(0, 0, 0, 0.5)",
    fontSize: 11,
    marginRight: 5
  },
  eventCardTitle: {
    ...theme.typography.headline,
    fontSize: 20,
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 0
  },
  eventCardLocation: {
    ...theme.typography.commentStyle,
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginTop: 8,
  },
  eventCardDescription: {
    ...theme.typography.commentStyle,
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: 14,
    lineHeight: '1.8em',
    marginTop: 30,
  },
  eventCardGroup: {
    ...theme.typography.commentStyle,
    maxWidth: 290,
    fontStyle: 'italic',
    color: "rgba(0, 0, 0, 0.5)",
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginTop: 10,
  },
  eventCardDeadline: {
    ...theme.typography.commentStyle,
    display: 'inline-block',
    fontWeight: 'bold',
    color: "rgba(0, 0, 0, 0.5)",
    fontSize: 16,
    paddingBottom: 5,
    marginTop: 20,
  },
  addToCal: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    bottom: 20,
    right: 20,
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
}))


const EventCards = ({events, loading, numDefaultCards, hideSpecialCards, classes}: {
  events?: PostsList[],
  loading?: boolean,
  numDefaultCards?: number,
  hideSpecialCards?: boolean,
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone()
  const { captureEvent } = useTracking()
  
  const getEventLocation = (event: PostsList): string => {
    if (event.onlineEvent) return 'Online'
    return event.location ? event.location.slice(0, event.location.lastIndexOf(',')) : ''
  }
  
  const { AddToCalendarIcon, PostsItemTooltipWrapper, CloudinaryImage2 } = Components
  
  // while the data is loading, show some placeholder empty cards
  if (loading && !events?.length) {
    return numDefaultCards ? <>
      {_.range(numDefaultCards).map((i) => {
        return <Card key={i} className={classes.eventCard}></Card>
      })}
    </> : null
  }
  
  if (!events?.length) {
    // link to the Community page when there are no events to show
    let communityName = 'Community'
    if (forumTypeSetting.get() === 'EAForum') {
      communityName = 'EA Community'
    } else if (forumTypeSetting.get() === 'LessWrong') {
      communityName = 'LessWrong Community'
    }
    return <div className={classes.noResults}>
      <div className={classes.noResultsText}>No upcoming events matching your search</div>
      <div className={classes.noResultsCTA}>
        <Link to={'/community'} className={classes.communityLink}>
          Explore the {communityName}
        </Link>
      </div>
    </div>
  }
  
  const eventCards = events.map(event => {
    return <Card key={event._id} className={classes.eventCard}>
      <Link to={`/events/${event._id}/${event.slug}`}>
        {event.eventImageId ?
          <CloudinaryImage2 height={200} width={373} publicId={event.eventImageId} /> :
          <img src={getDefaultEventImg(373)} style={{height: 200, width: 373}} />}
      </Link>
      <CardContent className={classes.eventCardContent}>
        <div className={classes.eventCardTime}>
          {event.eventType === 'course' && <span className={classes.eventCardTimeApply}>Apply by</span>}
          {prettyEventDateTimes(event, timezone, true)}
        </div>
        <PostsItemTooltipWrapper post={event}>
          <div className={classes.eventCardTitle}>
            <Link to={`/events/${event._id}/${event.slug}`}>{event.title}</Link>
          </div>
        </PostsItemTooltipWrapper>
        <div className={classes.eventCardLocation}>{getEventLocation(event)}</div>
        {event.group && <div className={classes.eventCardGroup} title={event.group.name}>
          <Link to={`/groups/${event.group._id}`}>{event.group.name}</Link>
        </div>}
        <div className={classes.addToCal}>
          <AddToCalendarIcon post={event} />
        </div>
      </CardContent>
    </Card>
  })
  
  // on the EA Forum, insert a card advertising the Intro VP
  if (forumTypeSetting.get() === 'EAForum' && !hideSpecialCards && events.length >= 2) {
    // find the next deadline for applying to the Intro VP, which is the last Sunday of every month
    let sunday = moment().day(0)
    _.range(5).forEach(() => {
      const nextSunday = moment(sunday).add(1, 'week')
      // needs to be in the future
      if (sunday.isBefore(moment(), 'day')) {
        sunday = nextSunday
      }
      // needs to be the last Sunday of the month
      if (nextSunday.month() === sunday.month()) {
        sunday = nextSunday
      }
    })
    
    // VP starts 8 days after the deadline, on a Monday
    const startOfVp = moment(sunday).add(8, 'days')
    // VP ends 8 weeks after the start (subtract a day to end on a Sunday)
    const endOfVp = moment(startOfVp).add(8, 'weeks').subtract(1, 'day')
    
    eventCards.splice(2, 0, (
      <a href="https://www.effectivealtruism.org/virtual-programs/introductory-program?from=forum_events_page"
        className={classes.specialEventCardLink}
        onClick={() => captureEvent('introVPClicked')}
      >
        <Card key="intro-vp" className={classNames(classes.eventCard, classes.specialEventCard)}>
          <div className={classes.eventCardTime}>
            {startOfVp.format('MMMM D')} - {endOfVp.format('MMMM D')}
          </div>
          <div className={classes.eventCardTitle}>
            Introductory EA Program
          </div>
          <div className={classes.eventCardLocation}>Online</div>
          <div className={classes.eventCardDescription}>
            This program is ideal for those new to effective altruism, or for those who have some familiarity,
            but want to explore the core ideas in a structured way.
          </div>
          <div className={classes.eventCardDeadline}>Apply by Sunday, {sunday.format('MMMM D')}</div>
        </Card>
      </a>
    ))
  }

  return <>
    {eventCards}
  </>
}

const EventCardsComponent = registerComponent('EventCards', EventCards, {styles});

declare global {
  interface ComponentTypes {
    EventCards: typeof EventCardsComponent
  }
}
