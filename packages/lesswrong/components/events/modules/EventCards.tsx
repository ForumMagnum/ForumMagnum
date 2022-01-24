import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import { Card, CardContent } from '@material-ui/core';
import { prettyEventDateTimes } from '../../../lib/collections/posts/helpers';
import { useTimezone } from '../../common/withTimezone';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  noResults: {
    ...theme.typography.commentStyle,
    gridColumn: '1 / 3',
    fontSize: 16,
  },
  noResultsText: {
    color: "rgba(0, 0, 0, 0.6)",
    marginTop: 10
  },
  noResultsCTA: {
    marginTop: 20
  },
  communityLink: {
    color: theme.palette.primary.main
  },
  eventCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 373px)',
    gridGap: '20px',
    justifyContent: 'center',
    marginTop: 16,
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
    [theme.breakpoints.down('xs')]: {
      // width: 'auto',
      height: 370
    }
  },
  eventCardContent: {
    position: 'relative',
    height: 170,
    // display: 'grid',
    // gridTemplateAreas: `
    //   "time ."
    //   "title ."
    //   "location ."
    //   "group tag"
    // `,
    // gridGap: '8px',
    // gridTemplateRows: '18px 60px 18px 18px',
    // alignItems: 'baseline',
    // [theme.breakpoints.down('xs')]: {
    //   gridTemplateAreas: `
    //   "time"
    //   "title"
    //   "location"
    //   "group"
    // `,
    // }
  },
  eventCardTime: {
    ...theme.typography.commentStyle,
    gridArea: 'time',
    fontSize: 14,
    color: theme.palette.primary.main
  },
  eventCardTitle: {
    ...theme.typography.headline,
    gridArea: 'title',
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
    gridArea: 'location',
    // textAlign: 'right',
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginTop: 10,
    // [theme.breakpoints.down('xs')]: {
    //   textAlign: 'left'
    // }
  },
  eventCardGroup: {
    ...theme.typography.commentStyle,
    gridArea: 'group',
    maxWidth: 290,
    fontStyle: 'italic',
    color: "rgba(0, 0, 0, 0.5)",
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginTop: 10,
  },
  eventCardTag: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    bottom: 22,
    right: 22,
    gridArea: 'tag',
    // textAlign: 'right',
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
}))

/**
 * Randomly assigns one of twelve images to the event based on its _id.
 * 
 * @param eventId - _id of the event/post
 * @returns img url
 */
const randomEventImg = (eventId) => {
  const num = _.range(eventId.length).reduce((prev, next) => {
    return prev + eventId.charCodeAt(next)
  }, 0) % 12

  switch (num) {
    case 0:
      return 'Banner/c4xfkjbyrkgzk67j8yhx'
    case 1:
      return 'Banner/lm7in6trshkcnqgeybqr'
    case 2:
      return 'Banner/tpa8dburf2fpv7vkqw3h'
    case 3:
      return 'Banner/k1uurxviebati6mpaund'
    case 4:
      return 'Banner/mngmri7qblzit9jigof4'
    case 5:
      return 'Banner/rpeoujevvhdhulgevv3u'
    case 6:
      return 'Banner/vxquzxthtaiha6r5lzbq'
    case 7:
      return 'Banner/rp0ywuja8mflliboqoxb'
    case 8:
      return 'Banner/yvfw6msbycjpz7wncawu'
    case 9:
      return 'Banner/rpsvlou1aci2rpz0zpfs'
    case 10:
      return 'Banner/jouhj45hrkkfkhinknbg'
    default:
      return 'Banner/qfffq3yggslcyttsonxq'
  }
}

const EventCards = ({events, loading, numDefaultCards, classes}: {
  events?: PostsList[],
  loading: boolean,
  numDefaultCards: number,
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone()
  
  const getEventLocation = (event) => {
    if (event.onlineEvent) return 'Online'
    return event.location ? event.location.slice(0, event.location.lastIndexOf(',')) : ''
  }
  
  const { AddToCalendarIcon, PostsItemTooltipWrapper, CloudinaryImage2 } = Components
  
  if (loading) {
    return <>
      {_.range(numDefaultCards).map((i) => {
        return <Card key={i} className={classes.eventCard}></Card>
      })}
    </>
  }
  
  if (!events?.length) {
    return <div className={classes.noResults}>
      <div className={classes.noResultsText}>No matching results</div>
      <div className={classes.noResultsCTA}>
        Why not <Link to={'/community'} className={classes.communityLink}>explore the EA Community</Link>?
      </div>
    </div>
  }

  return <>
    {events.map(event => {
      return <Card key={event._id} className={classes.eventCard}>
        <CloudinaryImage2 height={200} width={373} publicId={event.eventImageId || 'Banner/yeldubyolqpl3vqqy0m6'} />
        <CardContent className={classes.eventCardContent}>
          <div className={classes.eventCardTime}>
            {prettyEventDateTimes(event, timezone, true)}
          </div>
          <PostsItemTooltipWrapper
            post={event}
            className={''}
          >
            <div className={classes.eventCardTitle}>
              <Link to={`/events/${event._id}/${event.slug}`}>{event.title}</Link>
            </div>
          </PostsItemTooltipWrapper>
          <div className={classes.eventCardLocation}>{getEventLocation(event)}</div>
          {event.group && <div className={classes.eventCardGroup} title={event.group.name}>
            <Link to={`/groups/${event.group._id}`}>{event.group.name}</Link>
          </div>}
          <div className={classes.eventCardTag}>
            <AddToCalendarIcon post={event} />
          </div>
        </CardContent>
      </Card>
    })}
  </>
}

const EventCardsComponent = registerComponent('EventCards', EventCards, {styles});

declare global {
  interface ComponentTypes {
    EventCards: typeof EventCardsComponent
  }
}
