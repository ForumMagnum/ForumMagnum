import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { useState, useEffect } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userGetLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
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
import { geoSuggestStyles } from '../form-components/LocationFormComponent'
import Geosuggest from 'react-geosuggest';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  highlightCard: {
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
  highlightedCardRow: {
    marginTop: 13
  },
  highlightedCardTitle: {
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
  highlightedCardGroup: {
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
  highlightedCardDetail: {
    ...theme.typography.commentStyle,
    display: 'inline',
    background: 'black',
    '-webkit-box-decoration-break': 'clone',
    boxDecorationBreak: 'clone',
    fontSize: 18,
    color: '#b8d4de',//'#ccdee4',
    padding: '0.5rem',
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
    padding: 20,
    margin: 'auto',
    // [theme.breakpoints.down('xs')]: {
    //   padding: 0
    // }
  },
  sectionHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 800,
    margin: '40px auto',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      margin: '30px auto',
    }
  },
  sectionHeading: {
    // ...theme.typography.commentStyle,
    flex: 'none',
    textAlign: 'left',
    fontSize: 32,
    margin: 0
  },
  sectionDescription: {
    ...theme.typography.commentStyle,
    // maxWidth: 600,
    textAlign: 'left',
    fontSize: 14,
    lineHeight: '1.8em',
    // margin: 'auto'
    marginLeft: 80,
    [theme.breakpoints.down('sm')]: {
      marginTop: 10,
      marginLeft: 0
    }
  },
  filters: {
    gridColumnStart: 1,
    gridColumnEnd: -1,
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  where: {
    ...theme.typography.commentStyle,
    fontSize: 13,
  },
  geoSuggest: {
    ...geoSuggestStyles(theme),
    display: 'inline-block',
    maxWidth: 200,
    marginLeft: 6
  },
  filter: {
    marginLeft: 10,
    '@media (max-width: 812px)': {
      display: 'none',
    }
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
    height: 354,
    borderRadius: 0,
    overflow: 'visible',
    [theme.breakpoints.down('xs')]: {
      // width: 'auto',
      height: 370
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
    color: "rgba(0, 0, 0, 0.6)",
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
    gridColumnStart: 1,
    gridColumnEnd: -1,
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
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
  eventNotificationsBtn: {
    textTransform: 'none',
    fontSize: 14,
    '@media (max-width: 812px)': {
      display: 'none',
    }
  },
  eventNotificationsIcon: {
    fontSize: 18,
    marginRight: 6
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
  
  const { SingleColumnSection, SectionTitle, SectionFooter, Typography, SectionButton, AddToCalendarIcon, EventTime, Loading, PostsItemTooltipWrapper, CloudinaryImage2 } = Components

  const filters: PostsViewTerms = {}
  if (placeFilter === 'in-person') {
    filters.onlineEvent = false
  } else if (placeFilter === 'online') {
    filters.onlineEvent = true
  }
  
  const eventsListTerms: PostsViewTerms = userLocation ? {
    view: 'events',//'nearbyEvents',
    lat: userLocation.lat,
    lng: userLocation.lng,
    ...filters,
  } : {
    view: 'globalEvents',
    ...filters,
  }
  
  const { results, loading, error, showLoadMore, loadMore } = useMulti({
    terms: eventsListTerms,
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 6,
    itemsPerPage: 6,
    skip: !userLocation && currentUserLocation.loading
  });
  
  let highlightedEvent: PostsList|null = null;
  if (results && results.length > 0) {
    results.forEach(result => {
      if (!highlightedEvent && !result.onlineEvent) {
        highlightedEvent = result
      }
    })
    if (!highlightedEvent) highlightedEvent = results[0]
  }
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()
  // const highlightedEventImg = highlightedEvent ? `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_350,w_800/Event/defaults/k7bdilxm08silijqdn2v` : ''
  const highlightedEventImg = highlightedEvent ? `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_350,w_800/${highlightedEvent.eventImageId || randomEventImg(highlightedEvent._id)}` : ''
  const cardBackground = highlightedEvent ? {
    backgroundImage: `linear-gradient(rgba(0, 87, 102, 0.7), rgba(0, 87, 102, 0.5)), url(${highlightedEventImg})`
  } : {}
  
  let loadMoreButton = showLoadMore && <button className={classes.loadMore} onClick={() => loadMore(null)}>
    Load More
  </button>
  if (loading && results) {
    loadMoreButton = <CircularProgress size={16} />
  }


  return (
    <>
      <AnalyticsContext pageContext="EventsHome">
        <div>
          <Card className={classes.highlightCard} style={cardBackground}>
            {highlightedEvent ? <CardContent className={classes.highlightCardContent}>
              <h1 className={classes.highlightedCardTitle}>
                <Link to={`/events/${highlightedEvent._id}/${highlightedEvent.slug}`}>{highlightedEvent.title}</Link>
              </h1>
              {highlightedEvent.group && <div className={classes.highlightedCardRow}>
                <span className={classes.highlightedCardGroup}>
                  <Link to={`/groups/${highlightedEvent.group._id}`}>{highlightedEvent.group.name}</Link>
                </span>
              </div>}
              <div className={classes.highlightedCardRow}>
                <span className={classes.highlightedCardDetail}>
                  {prettyEventDateTimes(highlightedEvent, timezone, true)}
                </span>
              </div>
              <div className={classes.highlightedCardRow}>
                <span className={classes.highlightedCardDetail}>
                  {highlightedEvent.onlineEvent ? 'Online event' : highlightedEvent.location?.split(',')[0]}
                </span>
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
          <div className={classes.sectionHeadingRow}>
            <h1 className={classes.sectionHeading}>Events</h1>
            <div className={classes.sectionDescription}>
              Connect with people near you and around the world who are trying to find the best ways to help others. Learn, discuss, collaborate, or just hang out with like-minded people.
            </div>
          </div>

          <div className={classes.eventCards}>
            <div className={classes.filters}>
              <div className={classes.where}>
                Showing events near {mapsLoaded
                  && <div className={classes.geoSuggest}>
                      <Geosuggest
                        placeholder="Location"
                        onSuggestSelect={(suggestion) => {
                          if (suggestion?.location) {
                            setUserLocation(suggestion.location);
                          }
                        }}
                        initialValue={"" /*TODO*/}
                      />
                    </div>
                }
              </div>
              <Select
                className={classes.filter}
                value={placeFilter}
                onChange={(e) => setPlaceFilter(e.target.value)}>
                  <MenuItem key="all" value="all">In-person and online</MenuItem>
                  <MenuItem key="in-person" value="in-person">In-person only</MenuItem>
                  <MenuItem key="online" value="online">Online only</MenuItem>
              </Select>
            </div>

            {results ? results.map(event => {
              return <Card key={event._id} className={classes.eventCard}>
                <CloudinaryImage2 height={200} width={373} publicId={event.eventImageId || randomEventImg(event._id)} />
                <CardContent className={classes.eventCardContent}>
                  <PostsItemTooltipWrapper
                    post={event}
                    className={''}
                  >
                    <div className={classes.eventCardTitle}>
                      <Link to={`/events/${event._id}/${event.slug}`}>{event.title}</Link>
                    </div>
                  </PostsItemTooltipWrapper>
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
            
            <div className={classes.loadMoreRow}>
              <Button variant="text" color="primary" onClick={openEventNotificationsForm} className={classes.eventNotificationsBtn}>
                <NotificationsNoneIcon className={classes.eventNotificationsIcon} />
                {currentUser?.nearbyEventsNotifications ? `Edit my event notification settings` : `Sign up for event notifications`}
              </Button>
              {loadMoreButton}
            </div>
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
