import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { useState, useEffect } from 'react';
import { userGetLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { useDialog } from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useUpdate } from '../../lib/crud/withUpdate';
import { pickBestReverseGeocodingResult } from '../../server/mapsUtils';
import { useGoogleMaps } from '../form-components/LocationFormComponent';
import { Button, CircularProgress, Select, MenuItem } from '@material-ui/core';
import { useMulti } from '../../lib/crud/withMulti';
import { getBrowserLocalStorage } from '../async/localStorageHandlers';
import { geoSuggestStyles } from '../form-components/LocationFormComponent'
import Geosuggest from 'react-geosuggest';

const styles = createStyles((theme: ThemeType): JssStyles => ({
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
    fontSize: 34,
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


const EventsHome = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  
  const [userLocation, setUserLocation] = useState(() => {
    if (currentUser) {
      if (!currentUser.mongoLocation) return null

      console.log('mongolocation', currentUser.mongoLocation)
      return {
        lat: currentUser.mongoLocation.coordinates[1],
        lng: currentUser.mongoLocation.coordinates[0],
        known: true,
        label: currentUser.location
      }
    }
    
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
    
    if (mapsLoaded && !geocodeError && !userLocation && known) {
      try {
        // get a list of matching Google locations for the current lat/lng
        const geocoder = new googleMaps.Geocoder();
        const geocodingResponse = await geocoder.geocode({
          location: {lat, lng}
        });
        const results = geocodingResponse?.results;
        
        if (results?.length) {
          console.log('results', results)
          const location = pickBestReverseGeocodingResult(results)
          saveUserLocation({lat, lng, known, gmaps: location})
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
  
  const saveUserLocation = ({lat, lng, known, gmaps}) => {
    // save it in the page state
    setUserLocation({lat, lng, known, label: gmaps.formatted_address})

    if (currentUser) {
      // save it on the user level
      void updateUser({
        selector: {_id: currentUser._id},
        data: {
          location: gmaps.formatted_address,
          googleLocation: gmaps
        }
      })
    } else {
      // save it in local storage
      const ls = getBrowserLocalStorage()
      try {
        ls?.setItem('userlocation', JSON.stringify({lat, lng, known, label: gmaps.formatted_address}))
      } catch(e) {
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    }
  }

  const openEventNotificationsForm = () => {
    openDialog({
      componentName: currentUser ? "EventNotificationsDialog" : "LoginPopup",
    });
  }
  
  const { HighlightedEventCard, EventCards } = Components

  const filters: PostsViewTerms = {}
  if (placeFilter === 'in-person') {
    filters.onlineEvent = false
  } else if (placeFilter === 'online') {
    filters.onlineEvent = true
  }
  
  const eventsListTerms: PostsViewTerms = userLocation ? {
    view: 'nearbyEvents',
    lat: userLocation.lat,
    lng: userLocation.lng,
    ...filters,
  } : {
    view: 'globalEvents',
    ...filters,
  }
  
  const { results, loading, showLoadMore, loadMore } = useMulti({
    terms: eventsListTerms,
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 6,
    itemsPerPage: 6,
    skip: !userLocation && currentUserLocation.loading
  });
  
  let highlightedEvent: PostsList|undefined;
  if (results && results.length > 0) {
    results.forEach(result => {
      if (!highlightedEvent && !result.onlineEvent) {
        highlightedEvent = result
      }
    })
    if (!highlightedEvent) highlightedEvent = results[0]
  }
  
  let loadMoreButton = showLoadMore && <button className={classes.loadMore} onClick={() => loadMore(null)}>
    Load More
  </button>
  if (loading && results?.length) {
    loadMoreButton = <CircularProgress size={16} />
  }

  return (
    <>
      <AnalyticsContext pageContext="EventsHome">
        <div>
          <HighlightedEventCard event={highlightedEvent} loading={loading} />
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
                            saveUserLocation({
                              ...suggestion.location,
                              known: true,
                              gmaps: suggestion.gmaps
                            })
                          }
                        }}
                        initialValue={userLocation?.label}
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

            <EventCards events={results} loading={loading} numDefaultCards={6} />
            
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
