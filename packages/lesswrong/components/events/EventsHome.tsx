import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { useState, useEffect } from 'react';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { useDialog } from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useUpdate } from '../../lib/crud/withUpdate';
import { pickBestReverseGeocodingResult } from '../../server/mapsUtils';
import { useGoogleMaps, geoSuggestStyles } from '../form-components/LocationFormComponent';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { useMulti } from '../../lib/crud/withMulti';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import Geosuggest from 'react-geosuggest';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  section: {
    maxWidth: 1200,
    padding: 20,
    margin: 'auto',
  },
  sectionHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 700,
    margin: '40px auto',
    '@media (max-width: 812px)': {
      flexDirection: 'column',
      margin: '30px auto',
    }
  },
  sectionHeading: {
    flex: 'none',
    textAlign: 'left',
    ...theme.typography.headline,
    fontSize: 34,
    margin: 0
  },
  sectionDescription: {
    ...theme.typography.commentStyle,
    textAlign: 'left',
    fontSize: 14,
    lineHeight: '1.8em',
    marginLeft: 60,
    '@media (max-width: 812px)': {
      marginTop: 10,
      marginLeft: 0
    }
  },
  filters: {
    gridColumnStart: 1,
    gridColumnEnd: -1,
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
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
    alignItems: 'center'
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
  
  // this is the actual location used for the events query -
  // to make the page load faster, we try to use a saved location
  const [queryLocation, setQueryLocation] = useState(() => {
    if (currentUser) {
      if (!currentUser.mongoLocation || !currentUser.location) return null
      return {
        lat: currentUser.mongoLocation.coordinates[1],
        lng: currentUser.mongoLocation.coordinates[0],
        known: true,
        label: currentUser.location
      }
    }
    // if the user isn't logged in, see if we saved it in local storage
    const ls = getBrowserLocalStorage()
    if (!ls) return null
    try {
      return JSON.parse(ls.getItem('userlocation'))
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return null
    }
  })
  
  // in-person, online, or all
  const [modeFilter, setModeFilter] = useState('all')

  // used to set the user's location if they did not already have one
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersProfile',
  });
  
  /**
   * Given a location, update the page query to use that location,
   * then save it to the user's settings (if they are logged in)
   * or to the browser's local storage (if they are logged out).
   *
   * @param {Object} location - The location to save for the user.
   * @param {number} location.lat - The location's latitude.
   * @param {number} location.lng - The location's longitude.
   * @param {Object} location.gmaps - The Google Maps location data.
   * @param {string} location.gmaps.formatted_address - The user-facing address.
   */
  const saveUserLocation = ({lat, lng, gmaps}) => {
    // save it in the page state
    setQueryLocation({lat, lng, known: true, label: gmaps.formatted_address})

    if (currentUser) {
      // save it on the user document
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
        ls?.setItem('userlocation', JSON.stringify({lat, lng, known: true, label: gmaps.formatted_address}))
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  }
  
  // if the current user provides their browser location and we don't have a location saved for them,
  // save it accordingly
  const [mapsLoaded, googleMaps] = useGoogleMaps("CommunityHome")
  const [geocodeError, setGeocodeError] = useState(false)
  const saveReverseGeocodedLocation = async ({lat, lng, known}) => {
    // we need Google Maps to be loaded before we can call the Geocoder
    if (mapsLoaded && !geocodeError && !queryLocation && known) {
      try {
        // get a list of matching Google locations for the current lat/lng (reverse geocoding)
        const geocoder = new googleMaps.Geocoder();
        const geocodingResponse = await geocoder.geocode({
          location: {lat, lng}
        });
        const results = geocodingResponse?.results;
        
        if (results?.length) {
          const location = pickBestReverseGeocodingResult(results)
          saveUserLocation({lat, lng, gmaps: location})
        }
      } catch (e) {
        setGeocodeError(true)
        // eslint-disable-next-line no-console
        console.error(e?.message)
      }
    }
  }

  // this gets the location from the current user settings or from the user's browser
  const currentUserLocation = useUserLocation(currentUser)
  
  useEffect(() => {
    // if we've gotten a location from the browser, save it
    if (!queryLocation && !currentUserLocation.loading && currentUserLocation.known) {
      void saveReverseGeocodedLocation(currentUserLocation)
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryLocation, currentUserLocation])

  const openEventNotificationsForm = () => {
    openDialog({
      componentName: currentUser ? "EventNotificationsDialog" : "LoginPopup",
    });
  }
  
  const { HighlightedEventCard, EventCards, Loading } = Components

  const filters: PostsViewTerms = {}
  if (modeFilter === 'in-person') {
    filters.onlineEvent = false
  } else if (modeFilter === 'online') {
    filters.onlineEvent = true
  }
  
  const eventsListTerms: PostsViewTerms = queryLocation ? {
    view: 'nearbyEvents',
    lat: queryLocation.lat,
    lng: queryLocation.lng,
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
    limit: 12,
    itemsPerPage: 6,
    skip: !queryLocation && currentUserLocation.loading
  });
  
  // we try to highlight the event most relevant to you
  let highlightedEvent: PostsList|undefined;
  if (results && results.length > 0) {
    // first, try to find the next in-person event near you
    results.forEach(result => {
      if (!highlightedEvent && !result.onlineEvent) {
        highlightedEvent = result
      }
    })
    // if none, then try to find the next "local" online event near you
    results.forEach(result => {
      if (!highlightedEvent && !result.globalEvent) {
        highlightedEvent = result
      }
    })
    // otherwise, just show the first event in the list
    if (!highlightedEvent) highlightedEvent = results[0]
  }
  
  let loadMoreButton = showLoadMore && <button className={classes.loadMore} onClick={() => loadMore(null)}>
    Load More
  </button>
  if (loading && results?.length) {
    loadMoreButton = <div><Loading /></div>
  }

  return (
    <AnalyticsContext pageContext="EventsHome">
      <div>
        <HighlightedEventCard event={highlightedEvent} loading={loading} />
      </div>

      <div className={classes.section}>
        <div className={classes.sectionHeadingRow}>
          <h1 className={classes.sectionHeading}>Events</h1>
          <div className={classes.sectionDescription}>
            Join people from around the world for discussions, talks, and other events on how we can tackle
            the world's biggest problems.
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
                            gmaps: suggestion.gmaps
                          })
                        }
                      }}
                      initialValue={queryLocation?.label}
                    />
                  </div>
              }
            </div>
            <Select
              className={classes.filter}
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}>
                <MenuItem key="all" value="all">In-person and online</MenuItem>
                <MenuItem key="in-person" value="in-person">In-person only</MenuItem>
                <MenuItem key="online" value="online">Online only</MenuItem>
            </Select>
          </div>

          <EventCards events={results} loading={loading} numDefaultCards={6} />
          
          <div className={classes.loadMoreRow}>
            <Button variant="text" color="primary" onClick={openEventNotificationsForm} className={classes.eventNotificationsBtn}>
              <NotificationsNoneIcon className={classes.eventNotificationsIcon} />
              {currentUser?.nearbyEventsNotifications ? `Edit my notification settings` : `Sign up for notifications`}
            </Button>
            {loadMoreButton}
          </div>
        </div>
        
      </div>
    </AnalyticsContext>
  )
}

const EventsHomeComponent = registerComponent('EventsHome', EventsHome, {styles});

declare global {
  interface ComponentTypes {
    EventsHome: typeof EventsHomeComponent
  }
}
