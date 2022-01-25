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
import { DEFAULT_EVENT_IMG } from './HighlightedEventCard';

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
      height: 370
    }
  },
  eventCardContent: {
    position: 'relative',
    height: 170,
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
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginTop: 8,
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
    bottom: 20,
    right: 20,
    gridArea: 'tag',
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
}))


const EventCards = ({events, loading, numDefaultCards, classes}: {
  events?: PostsList[],
  loading: boolean,
  numDefaultCards: number,
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone()
  
  const getEventLocation = (event: PostsList): string => {
    if (event.onlineEvent) return 'Online'
    return event.location ? event.location.slice(0, event.location.lastIndexOf(',')) : ''
  }
  
  const { AddToCalendarIcon, PostsItemTooltipWrapper, CloudinaryImage2 } = Components
  
  // while the data is loading, show some placeholder empty cards
  if (loading) {
    return <>
      {_.range(numDefaultCards).map((i) => {
        return <Card key={i} className={classes.eventCard}></Card>
      })}
    </>
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

  return <>
    {events.map(event => {
      return <Card key={event._id} className={classes.eventCard}>
        <Link to={`/events/${event._id}/${event.slug}`}>
          <CloudinaryImage2 height={200} width={373} publicId={event.eventImageId || DEFAULT_EVENT_IMG} />
        </Link>
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
