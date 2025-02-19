import React from 'react';
import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import Card from '@material-ui/core/Card';
import { useTimezone } from '../../common/withTimezone';
import { cloudinaryCloudNameSetting } from '../../../lib/publicSettings';
import { useTracking } from '../../../lib/analyticsEvents';
import { isFriendlyUI } from '../../../themes/forumTheme';

// space pic for events with no img
export const getDefaultEventImg = (width: number, blur?: boolean) => {
  return `https://res.cloudinary.com/cea/image/upload/w_${width}${blur ? ',e_blur:500' : ''}/Banner/yeldubyolqpl3vqqy0m6.jpg`
}

const styles = (theme: ThemeType) => ({
  root: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 800,
    height: 350,
    backgroundPosition: 'center',
    background: theme.palette.primary.main,
    textAlign: 'center',
    color: theme.palette.text.alwaysWhite,
    overflow: 'visible',
    boxShadow: theme.palette.boxShadow.moreFocused,
    borderRadius: theme.borderRadius.default,
    margin: 'auto',
    [theme.breakpoints.down('xs')]: {
      marginLeft: -8,
      marginRight: -8,
    }
  },
  recommendedText: {
    position: 'absolute',
    top: 20,
    left: 25,
    ...theme.typography.commentStyle,
    fontStyle: "italic",
    fontSize: 14,
    opacity: 0.7
  },
  addToCal: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    top: 20,
    right: 25,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  addToCalIcon: {
    fill: theme.palette.text.alwaysWhite,
  },
  content: {
    position: 'relative',
    padding: '10px 20px',
    overflow: 'visible',
  },
  text: {
    position: 'relative',
    zIndex: 1,
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  row: {
    marginTop: 8
  },
  title: {
    display: '-webkit-box',
    "-webkit-line-clamp": 4,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    ...theme.typography.headline,
    fontSize: 36,
    fontWeight: 600,
    color: theme.palette.text.alwaysWhite,
    marginTop: 0,
    marginBottom: 10,
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
    [theme.breakpoints.down('sm')]: {
      fontSize: 32,
    }
  },
  detail: {
    ...theme.typography.commentStyle,
    fontSize: 18,
    lineHeight: '1.4em',
    marginBottom: 8,
    '&:last-of-type': {
      marginBottom: 0
    }
  },
});

const HighlightedEventCard = ({event, loading, classes}: {
  event?: PostsList,
  loading: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { timezone } = useTimezone()
  const { captureEvent } = useTracking()
  
  const getEventLocation = (event: PostsList): string => {
    if (event.onlineEvent) return 'Online'
    return event.location ? event.location.slice(0, event.location.lastIndexOf(',')) : ''
  }
  
  const { Loading, AddToCalendarButton, PrettyEventDateTime } = Components
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()
  // the default img and color here should probably be forum-dependent
  const eventImg = event?.eventImageId ?
    `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_350,w_800,e_blur:500/${event.eventImageId}` :
    getDefaultEventImg(800, true)
  
  const cardBackground = {
    backgroundImage: `linear-gradient(rgba(0, 87, 102, 0.6), rgba(0, 87, 102, 0.6)), url(${eventImg})`
  }
  
  if (loading) {
    return <Card className={classes.root}>
      <div className={classes.spinnerContainer}>
        <Loading white />
      </div>
    </Card>
  }
  
  // if there's no event to show, default to showing EA Global
  if (!event) {
    return (
      <Card className={classes.root} style={cardBackground}>
        <div className={classes.recommendedText}>Recommended for you</div>
        <div className={classes.content}>
          <div className={classes.text}>
            <h1 className={classes.title}>
              <a href="https://www.eaglobal.org/" onClick={() => captureEvent('highlightedEventClicked')}>
                Effective Altruism Global
              </a>
            </h1>
            <div className={classes.detail}>
              Conferences in various locations
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={classes.root} style={cardBackground}>
      <div className={classes.recommendedText}>Recommended for you</div>
      <div className={classes.addToCal}>
        <AddToCalendarButton post={event} iconClassName={classes.addToCalIcon} />
      </div>
      <div className={classes.content}>
        <div className={classes.text}>
          <div className={classes.detail}>
            <PrettyEventDateTime post={event} timezone={timezone} dense={true} />
          </div>
          <h1 className={classes.title}>
            <Link to={`/events/${event._id}/${event.slug}`} onClick={() => captureEvent('highlightedEventClicked')}>
              {event.title}
            </Link>
          </h1>
          <div className={classes.detail}>
            {getEventLocation(event)}
          </div>
        </div>
      </div>
    </Card>
  )
}

const HighlightedEventCardComponent = registerComponent('HighlightedEventCard', HighlightedEventCard, {styles});

declare global {
  interface ComponentTypes {
    HighlightedEventCard: typeof HighlightedEventCardComponent
  }
}
