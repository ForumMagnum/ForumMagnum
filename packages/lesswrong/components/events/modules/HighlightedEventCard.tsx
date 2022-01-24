import React from 'react';
import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import { createStyles } from '@material-ui/core/styles';
import { Card, CardContent, CircularProgress } from '@material-ui/core';
import { prettyEventDateTimes } from '../../../lib/collections/posts/helpers';
import { useTimezone } from '../../common/withTimezone';
import { cloudinaryCloudNameSetting } from '../../../lib/publicSettings';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 800,
    height: 350,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: "rgba(0, 87, 102, 0.63)",
    background: theme.palette.primary.main,
    textAlign: 'center',
    color: 'white',
    borderRadius: 0,
    overflow: 'visible',
    margin: 'auto',
    [theme.breakpoints.down('xs')]: {
      marginLeft: -4,
      marginRight: -4,
    }
  },
  content: {
    overflow: 'visible'
  },
  spinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  spinner: {
    color: 'white'
  },
  row: {
    marginTop: 9
  },
  title: {
    ...theme.typography.headline,
    display: 'inline',
    // alignItems: 'flex-end',
    // justifyContent: 'center',
    // height: 110,
    background: 'black',
    '-webkit-box-decoration-break': 'clone',
    boxDecorationBreak: 'clone',
    fontSize: 36,
    lineHeight: '1.4em',
    color: 'white',
    padding: '0.5rem',
    marginBottom: 5,
    [theme.breakpoints.down('sm')]: {
      fontSize: 32,
    }
  },
  group: {
    ...theme.typography.commentStyle,
    display: 'inline',
    background: 'black',
    '-webkit-box-decoration-break': 'clone',
    boxDecorationBreak: 'clone',
    fontSize: 14,
    fontStyle: 'italic',
    padding: '0.5rem',
    marginBottom: 30,
  },
  detail: {
    ...theme.typography.commentStyle,
    display: 'inline',
    background: 'black',
    '-webkit-box-decoration-break': 'clone',
    boxDecorationBreak: 'clone',
    fontSize: 18,
    lineHeight: '1.4em',
    color: '#b8d4de',//'#ccdee4',
    padding: '0.5rem',
    marginBottom: 10
  },
  addToCal: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    top: 20,
    right: 20,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },

}))


const HighlightedEventCard = ({event, loading, classes}: {
  event?: PostsList,
  loading: boolean,
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone()
  
  const getEventLocation = (event) => {
    if (event.onlineEvent) return 'Online'
    return event.location ? event.location.slice(0, event.location.lastIndexOf(',')) : ''
  }
  
  const { AddToCalendarIcon } = Components
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()
  // const highlightedEventImg = event ? `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_350,w_800/Event/defaults/k7bdilxm08silijqdn2v` : ''
  // const highlightedEventImg = event ? `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_350,w_800/${event.eventImageId || randomEventImg(event._id)}` : ''
  const highlightedEventImg = event?.eventImageId ?
    `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_350,w_800/${event.eventImageId}` :
    `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_350,w_800/Banner/yeldubyolqpl3vqqy0m6`
  const cardBackground = {
    backgroundImage: `linear-gradient(rgba(0, 87, 102, 0.7), rgba(0, 87, 102, 0.5)), url(${highlightedEventImg})`
  }
  
  if (loading) {
    return <Card className={classes.root}>
      <div className={classes.spinnerContainer}>
        <CircularProgress className={classes.spinner}/>
      </div>
    </Card>
  }
  
  // if there's no event to show, default to showing EA Global
  if (!event) {
    return (
      <Card className={classes.root} style={cardBackground}>
        <CardContent className={classes.content}>
          <div>
            <h1 className={classes.title}>
              <a href="https://www.eaglobal.org/">Effective Altruism Global</a>
            </h1>
          </div>
          <div className={classes.row}>
            <span className={classes.detail}>
              Conferences in various locations
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
      <Card className={classes.root} style={cardBackground}>
        <CardContent className={classes.content}>
          <div>
            <span className={classes.detail}>
              {prettyEventDateTimes(event, timezone, true)}
            </span>
          </div>
          <div className={classes.row}>
            <h1 className={classes.title}>
              <Link to={`/events/${event._id}/${event.slug}`}>{event.title}</Link>
            </h1>
          </div>
          <div className={classes.row}>
            <span className={classes.detail}>
              {getEventLocation(event)}
            </span>
          </div>
          {/* {event.group && <div className={classes.row}>
            <span className={classes.group}>
              <Link to={`/groups/${event.group._id}`}>{event.group.name}</Link>
            </span>
          </div>} */}
          {/* <div className={classes.addToCal}>
            <AddToCalendarIcon post={event} hideTooltip hidePlusIcon />
          </div> */}
        </CardContent>
      </Card>
  )
}

const HighlightedEventCardComponent = registerComponent('HighlightedEventCard', HighlightedEventCard, {styles});

declare global {
  interface ComponentTypes {
    HighlightedEventCard: typeof HighlightedEventCardComponent
  }
}
