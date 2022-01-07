import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { useState, useEffect } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import { useLocation } from '../../lib/routeUtil';
import { useDialog } from '../common/withDialog'
import * as _ from 'underscore';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useUpdate } from '../../lib/crud/withUpdate';
import { pickBestReverseGeocodingResult } from '../../server/mapsUtils';
import { useGoogleMaps } from '../form-components/LocationFormComponent';
import { Button, Card, CardContent, CardMedia, CircularProgress, Select, MenuItem } from '@material-ui/core';
import { useMulti } from '../../lib/crud/withMulti';
import { prettyEventDateTimes } from '../../lib/collections/posts/helpers';
import { useTimezone } from '../common/withTimezone';
import { getBrowserLocalStorage } from '../async/localStorageHandlers';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  highlightCard: {
    position: 'relative',
    maxWidth: 800,
    height: 350,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: "rgba(0, 87, 102, 0.63)",
    background: theme.palette.primary.main,
    textAlign: 'center',
    color: 'white',
    overflow: 'visible',
    margin: 'auto',
    [theme.breakpoints.down('xs')]: {
      borderRadius: 0,
      marginLeft: -4,
      marginRight: -4,
    }
  },
  highlightCardContent: {
    overflow: 'visible'
  },
  highlightCardSpinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  highlightCardSpinner: {
    color: 'white'
  },
  highlightedCardTitle: {
    ...theme.typography.headline,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 110,
    fontSize: 36,
    color: 'white',
    marginBottom: 5,
  },
  highlightedCardGroup: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 30,
  },
  highlightedCardDetail: {
    ...theme.typography.commentStyle,
    fontSize: 18,
    color: '#ccdee4',
    marginBottom: 10
  },
  highlightedCardBtn: {
    backgroundColor: 'white'
  },
  highlightedCardAddToCal: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    top: 20,
    right: 20,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  section: {
    maxWidth: 1200,
    margin: 'auto'
  },
  sectionHeading: {
    ...theme.typography.commentStyle,
    textAlign: 'center',
    fontSize: 32,
    marginTop: 50
  },
  sectionDescription: {
    ...theme.typography.commentStyle,
    maxWidth: 600,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: '1.8em',
    margin: 'auto'
  },
  filters: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 20
  },
  filter: {
    marginLeft: 10
  },
  eventCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, auto)',
    gridGap: '20px',
    justifyContent: 'center',
    marginTop: 10,
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(2, auto)',
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'auto',
    }
  },
  eventCard: {
    position: 'relative',
    width: 400,
    height: 300,
    overflow: 'visible',
    [theme.breakpoints.down('xs')]: {
      width: 'auto',
      height: 318
    }
  },
  eventCardContent: {
    height: 150,
    display: 'grid',
    gridTemplateAreas: `
      "title location"
      "group ."
      "time tag"
    `,
    gridGap: '8px',
    gridTemplateRows: '60px 18px 18px',
    alignItems: 'baseline',
    [theme.breakpoints.down('xs')]: {
      gridTemplateAreas: `
      "title"
      "group"
      "time"
      "location"
    `,
    }
  },
  eventCardTitle: {
    ...theme.typography.headline,
    gridArea: 'title',
    fontSize: 20,
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginBottom: 0
  },
  eventCardLocation: {
    ...theme.typography.commentStyle,
    gridArea: 'location',
    textAlign: 'right',
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      textAlign: 'left'
    }
  },
  eventCardGroup: {
    ...theme.typography.commentStyle,
    gridArea: 'group',
    fontStyle: 'italic',
    fontSize: 14,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  eventCardTime: {
    ...theme.typography.commentStyle,
    gridArea: 'time',
    fontSize: 14,
  },
  eventCardTag: {
    ...theme.typography.commentStyle,
    gridArea: 'tag',
    textAlign: 'right',
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  loadMoreRow: {
    padding: '0 4px',
  },
  loadMore: {
    ...theme.typography.commentStyle,
    background: 'none',
    color: theme.palette.primary.main,
    fontSize: 16,
    padding: 0,
    '&:hover': {
      color: '#085d6c',
    }
  },
}))

interface ExternalProps {
}
interface EventsHomeProps extends ExternalProps, WithMessagesProps, WithLocationProps, WithDialogProps {
}
interface EventsHomeState {
  currentUserLocation: any,
}

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
      return 'https://res.cloudinary.com/cea/image/upload/v1640298598/Banner/c4xfkjbyrkgzk67j8yhx.jpg'
    case 1:
      return 'https://res.cloudinary.com/cea/image/upload/v1640294201/Banner/lm7in6trshkcnqgeybqr.jpg'
    case 2:
      return 'https://res.cloudinary.com/cea/image/upload/v1640127296/Banner/tpa8dburf2fpv7vkqw3h.jpg'
    case 3:
      return 'https://res.cloudinary.com/cea/image/upload/v1639983971/Banner/k1uurxviebati6mpaund.jpg'
    case 4:
      return 'https://res.cloudinary.com/cea/image/upload/v1640018933/Banner/mngmri7qblzit9jigof4.jpg'
    case 5:
      return 'https://res.cloudinary.com/cea/image/upload/v1640842793/Banner/rpeoujevvhdhulgevv3u.jpg'
    case 6:
      return 'https://res.cloudinary.com/cea/image/upload/v1640802869/Banner/vxquzxthtaiha6r5lzbq.jpg'
    case 7:
      return 'https://res.cloudinary.com/cea/image/upload/v1636673830/Banner/rp0ywuja8mflliboqoxb.jpg'
    case 8:
      return 'https://res.cloudinary.com/cea/image/upload/v1636794829/Banner/yvfw6msbycjpz7wncawu.jpg'
    case 9:
      return 'https://res.cloudinary.com/cea/image/upload/v1627712634/Banner/rpsvlou1aci2rpz0zpfs.jpg'
    case 10:
      return 'https://res.cloudinary.com/cea/image/upload/v1619611867/Banner/jouhj45hrkkfkhinknbg.jpg'
    case 11:
      return 'https://res.cloudinary.com/cea/image/upload/v1608560660/Banner/qfffq3yggslcyttsonxq.jpg'
  }
}

const EventsHome = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { query } = useLocation();
  const { timezone } = useTimezone()
  
  const [userLocation, setUserLocation] = useState(() => {
    const ls = getBrowserLocalStorage()
    if (!ls) return null
    try {
      return JSON.parse(ls.getItem('userlocation'))
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      return null
    }
  })
  const [placeFilter, setPlaceFilter] = useState('all')
  // const [events, setEvents] = useState(null)
  
  // useEffect(() => {
  //   setEvents()
  // }, [])
  
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersProfile',
  });
  
  const isEAForum = forumTypeSetting.get() === 'EAForum';
  
  // if the current user provides their browser location and they do not yet have a location in their user settings,
  // assign their browser location to their user settings location
  const [mapsLoaded, googleMaps] = useGoogleMaps("CommunityHome")
  const [geocodeError, setGeocodeError] = useState(false)
  const updateUserLocation = async ({lat, lng, known}) => {
    if (!userLocation) {
      setUserLocation({lat, lng, known})
    }
    
    const ls = getBrowserLocalStorage()
    try {
      ls?.setItem('userlocation', JSON.stringify({lat, lng, known}))
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
    
    if (isEAForum && mapsLoaded && !geocodeError && currentUser && !currentUser.location && known) {
      try {
        // get a list of matching Google locations for the current lat/lng
        const geocoder = new googleMaps.Geocoder();
        const geocodingResponse = await geocoder.geocode({
          location: {lat, lng}
        });
        const results = geocodingResponse?.results;
        
        if (results?.length) {
          const location = pickBestReverseGeocodingResult(results)
          void updateUser({
            selector: {_id: currentUser._id},
            data: {
              location: location?.formatted_address,
              googleLocation: location
            }
          })
        }
      } catch (e) {
        setGeocodeError(true)
        // eslint-disable-next-line no-console
        console.error(e?.message)
      }
    }
  }

  const [currentUserLocation, setCurrentUserLocation] = useState(userGetLocation(currentUser, updateUserLocation));
  
  useEffect(() => {
    userGetLocation(currentUser, (newLocation) => {
      if (!_.isEqual(currentUserLocation, newLocation)) {
        setCurrentUserLocation(newLocation);
      }
    });
  }, [currentUserLocation, currentUser]);

  const openEventNotificationsForm = () => {
    openDialog({
      componentName: currentUser ? "EventNotificationsDialog" : "LoginPopup",
    });
  }
  
  const { SingleColumnSection, SectionTitle, SectionFooter, Typography, SectionButton, AddToCalendarIcon, EventTime } = Components

  const filters = {}
  if (placeFilter === 'in-person') {
    filters.onlineEvent = false
  } else if (placeFilter === 'online') {
    filters.onlineEvent = true
  }
  
  console.log('currentUserLocation', currentUserLocation)
  console.log('userLocation', userLocation)
  const eventsListTerms = userLocation ? {
    view: 'events', //'nearbyEvents',
    lat: userLocation.lat,
    lng: userLocation.lng,
  } : {
    view: 'globalEvents',
  }
  
  const { results, loading, error, showLoadMore, loadMore } = useMulti({
    terms: Object.assign(eventsListTerms, filters),
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 6,
    itemsPerPage: 6,
    skip: !userLocation && currentUserLocation.loading
  });
  console.log('loading', loading)
  console.log('results', results)
  
  let highlightedEvent: PostsList|null = null;
  if (results && results.length > 0) {
    results.forEach(result => {
      if (!highlightedEvent && !result.onlineEvent) {
        highlightedEvent = result
      }
    })
    if (!highlightedEvent) highlightedEvent = results[0]
  }
  console.log('highlightedEvent', highlightedEvent)
  
  const cardBackground = highlightedEvent ? {
    backgroundImage: `linear-gradient(rgba(0, 87, 102, 0.63), rgba(0, 87, 102, 0.63)), url(${randomEventImg(highlightedEvent._id)})`
  } : {}


  return (
    <>
      <AnalyticsContext pageContext="EventsHome">
        <div>
          <Card className={classes.highlightCard} style={cardBackground}>
            {highlightedEvent ? <CardContent className={classes.highlightCardContent}>
              <h1 className={classes.highlightedCardTitle}>
                <Link to={`/events/${highlightedEvent._id}/${highlightedEvent.slug}`}>{highlightedEvent.title}</Link>
              </h1>
              {highlightedEvent.group && <div className={classes.highlightedCardGroup}>
                <Link to={`/groups/${highlightedEvent.group._id}`}>{highlightedEvent.group.name}</Link>
              </div>}
              <div className={classes.highlightedCardDetail}>
                {prettyEventDateTimes(highlightedEvent, timezone, true)}
              </div>
              <div className={classes.highlightedCardDetail}>
                {highlightedEvent.onlineEvent ? 'Online event' : highlightedEvent.location?.split(',')[0]}
              </div>
              {/* <Button variant="contained" className={classes.highlightedCardBtn}>RSVP</Button> */}
              <div className={classes.highlightedCardAddToCal}>
                <AddToCalendarIcon post={highlightedEvent} hideTooltip hidePlusIcon />
              </div>
            </CardContent> : <div className={classes.highlightCardSpinnerContainer}>
              <CircularProgress className={classes.highlightCardSpinner}/>
            </div>}
          </Card>
        </div>
        <div className={classes.section}>
          <h1 className={classes.sectionHeading}>Events</h1>
          <div className={classes.sectionDescription}>
            Connect with people near you and around the world who are trying to find the best ways to help others. Learn, discuss, collaborate, or just hang out with like-minded people.
          </div>
          
          <div className={classes.filters}>
            <Select
              className={classes.filter}
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}>
                <MenuItem key="all" value="all">In-person and online</MenuItem>
                <MenuItem key="in-person" value="in-person">In-person only</MenuItem>
                <MenuItem key="online" value="online">Online only</MenuItem>
            </Select>
          </div>
          <div className={classes.eventCards}>
            {results ? results.map(event => {
              return <Card key={event._id} className={classes.eventCard}>
                <CardMedia
                  component="img"
                  height="150"
                  image={randomEventImg(event._id)}
                  style={{objectFit: 'cover', borderRadius: '4px 4px 0 0'}}
                />
                <CardContent className={classes.eventCardContent}>
                  <div className={classes.eventCardTitle} title={event.title}>
                    <Link to={`/events/${event._id}/${event.slug}`}>{event.title}</Link>
                  </div>
                  <div className={classes.eventCardLocation}>{event.onlineEvent ? 'Online' : event.location?.split(',')[0]}</div>
                  {event.group && <div className={classes.eventCardGroup} title={event.group.name}>
                    <Link to={`/groups/${event.group._id}`}>{event.group.name}</Link>
                  </div>}
                  <div className={classes.eventCardTime}>
                    {prettyEventDateTimes(event, timezone, true)}
                  </div>
                  <div className={classes.eventCardTag}>
                    <AddToCalendarIcon post={event} />
                  </div>
                </CardContent>
              </Card>
            }) : _.range(6).map((i) => {
              return <Card key={i} className={classes.eventCard}></Card>
            })}
            {(showLoadMore || (loading && results)) && <div className={classes.loadMoreRow}>
              {loading ? <CircularProgress size={16} /> : <button className={classes.loadMore} onClick={() => loadMore(null)}>
                Load More
              </button>}
            </div>}
          </div>
          
        </div>
      </AnalyticsContext>
    </>
  )
}

const EventsHomeComponent = registerComponent('EventsHome', EventsHome, {styles});

declare global {
  interface ComponentTypes {
    EventsHome: typeof EventsHomeComponent
  }
}
