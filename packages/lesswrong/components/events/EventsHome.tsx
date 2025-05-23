import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState, useEffect } from 'react';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import FilterIcon from '@/lib/vendor/@material-ui/icons/src/FilterList';
import { useDialog } from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { pickBestReverseGeocodingResult } from '../../lib/geocoding';
import { useGoogleMaps, geoSuggestStyles } from '../form-components/LocationFormComponent';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import { useMulti } from '../../lib/crud/withMulti';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import Geosuggest from 'react-geosuggest';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { isEAForum } from '../../lib/instanceSettings';
import { EVENT_TYPES } from "@/lib/collections/posts/constants";
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import OutlinedInput from '@/lib/vendor/@material-ui/core/src/OutlinedInput';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import ListItemText from '@/lib/vendor/@material-ui/core/src/ListItemText';
import classNames from 'classnames';

import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import EventNotificationsDialog from "../localGroups/EventNotificationsDialog";
import LoginPopup from "../users/LoginPopup";
import HighlightedEventCard from "./modules/HighlightedEventCard";
import EventCards from "./modules/EventCards";
import Loading from "../vulcan-core/Loading";
import DistanceUnitToggle from "../community/modules/DistanceUnitToggle";
import { MenuItem } from "../common/Menus";
import ForumIcon from "../common/ForumIcon";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UsersProfileUpdateMutation = gql(`
  mutation updateUserEventsHome($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersProfile
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
    ...theme.typography.headline,
    fontSize: 34,
    margin: 0,
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  sectionDescription: {
    ...theme.typography.commentStyle,
    textAlign: 'left',
    fontSize: 15,
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
    alignItems: 'baseline',
    columnGap: 10,
    ...theme.typography.commentStyle,
    fontSize: 13,
  },
  where: {
    flex: '1 0 0',
    color: theme.palette.text.dim60,
    paddingLeft: 3
  },
  geoSuggest: {
    ...geoSuggestStyles(theme),
    display: 'inline-block',
    minWidth: 200,
    marginLeft: 6
  },
  filterIcon: {
    alignSelf: 'center',
    fontSize: 20
  },
  filter: {
    '& .MuiOutlinedInput-input': {
      paddingRight: 30
    },
    '@media (max-width: 812px)': {
      display: 'none'
    }
  },
  distanceFilter: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.dim60,
  },
  distanceInput: {
    width: 68,
    color: theme.palette.primary.main,
    margin: '0 6px'
  },
  formatFilter: {
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  placeholder: {
    color: theme.palette.text.dim40,
  },
  notifications: {
    flex: '1 0 0',
    textAlign: 'right'
  },
  notificationsBtn: {
    textTransform: 'none',
    fontSize: 14,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
      padding: '8px 8px'
    }
  },
  notificationsIcon: {
    fontSize: 18,
    marginRight: 6,
    [theme.breakpoints.down('xs')]: {
      fontSize: 16,
      marginRight: 4
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
  },
  loadMore: {
    ...theme.typography.commentStyle,
    background: 'none',
    color: theme.palette.primary.main,
    fontSize: 16,
    padding: 0,
    '&:hover': {
      color: theme.palette.eventsHomeLoadMoreHover,
    }
  },
  loading: {
    display: 'inline-block'
  },
});

const EventsHome = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  
  // in-person, online, or all
  const [modeFilter, setModeFilter] = useState('all')
  // ex. presentation, discussion, course, etc. (see EVENT_TYPES for full list)
  const [formatFilter, setFormatFilter] = useState<Array<string>>([])

  // used to set the user's location if they did not already have one
  const [updateUser] = useMutation(UsersProfileUpdateMutation);

  // used to set the cutoff distance for the query (default to 160 km / 100 mi)
  const [distance, setDistance] = useState(160)
  const [distanceUnit, setDistanceUnit] = useState<"km"|"mi">('km')
  
  useEffect(() => {
    const ls = getBrowserLocalStorage()
    const savedDistance = parseFloat(ls?.getItem('eventsDistanceFilter') ?? '0')
    if (savedDistance) {
      setDistance(savedDistance)
    }
    
    // only US and UK default to miles - everyone else defaults to km
    // (this is checked here to allow SSR to work properly)
    if (['en-US', 'en-GB'].some(lang => lang === window?.navigator?.language)) {
      setDistanceUnit('mi')
      setDistance(Math.round((savedDistance || distance) * 0.621371))
    }
    
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  /**
   * Given a location, update the page query to use that location,
   * then save it to the user's settings (if they are logged in)
   * or to the browser's local storage (if they are logged out).
   *
   * @param {Object} location - The location to save for the user.
   * @param {number} location.lat - The location's latitude.
   * @param {number} location.lng - The location's longitude.
   * @param {Object} location.gmaps - The Google Maps location data.
   * @param {string} location.gmaps.formatted_address - The user-facing address (ex: Cambridge, MA, USA).
   */
  const saveUserLocation = ({lat, lng, gmaps}: {
    lat: number;
    lng: number;
    gmaps?: google.maps.GeocoderResult
  }) => {
    // save it in the page state
    userLocation.setLocationData({lat, lng, loading: false, known: true, label: gmaps?.formatted_address})

    if (currentUser) {
      // save it on the user document
      void updateUser({
        variables: {
          selector: { _id: currentUser._id },
          data: {
            location: gmaps?.formatted_address,
            googleLocation: gmaps
          }
        }
      })
    } else {
      // save it in local storage
      const ls = getBrowserLocalStorage()
      try {
        ls?.setItem('userlocation', JSON.stringify({lat, lng, known: true, label: gmaps?.formatted_address}))
      } catch(e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  }
  
  // if the current user provides their browser location and we don't have a location saved for them,
  // save it accordingly
  const [mapsLoaded, googleMaps] = useGoogleMaps()
  const [geocodeError, setGeocodeError] = useState(false)
  const saveReverseGeocodedLocation = async ({lat, lng, known}: {
    lat: number;
    lng: number;
    known: boolean;
  }) => {
    if (
      mapsLoaded &&     // we need Google Maps to be loaded before we can call the Geocoder
      !geocodeError &&  // if we've ever gotten a geocoding error, don't try again
      known             // skip if we've received the default location
    ) {
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
        } else {
          // update the page state to indicate that we're not waiting on a location name
          userLocation.setLocationData({...userLocation, label: null})
        }
      } catch (e) {
        setGeocodeError(true)
        // eslint-disable-next-line no-console
        console.error(e?.message)
        // update the page state to indicate that we're not waiting on a location name
        userLocation.setLocationData({...userLocation, label: null})
      }
    }
  }

  // on page load, try to get the user's location from:
  // 1. (logged in user) user settings
  // 2. (logged out user) browser's local storage
  // 3. failing those, browser's geolocation API (which we then try to save in #1 or #2)
  const userLocation = useUserLocation(currentUser)
  
  useEffect(() => {
    // if we've gotten a location from the browser's geolocation API, save it
    if (!userLocation.loading && userLocation.known && userLocation.label === '') {
      void saveReverseGeocodedLocation(userLocation)
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation])

  const openEventNotificationsForm = () => {
    if (currentUser) {
      openDialog({
        name: "EventNotificationsDialog",
        contents: ({onClose}) => <EventNotificationsDialog onClose={onClose} />
      });
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
    }
  }
  
  const handleChangeDistance = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const distance = parseInt(e.target.value)
    setDistance(distance)
    
    // save it in local storage in km
    const ls = getBrowserLocalStorage()
    const distanceKm = `${distanceUnit === 'mi' ? Math.round(distance / 0.621371) : distance}`
    ls?.setItem('eventsDistanceFilter', distanceKm)
  }
  
  const handleChangeDistanceUnit = (unit: 'km' | 'mi') => {
    setDistanceUnit(unit)
    // when changing between miles and km, we convert the distance to the new unit
    setDistance(unit === 'mi' ? Math.round(distance * 0.621371) : Math.round(distance / 0.621371))
  }
  // on the EA Forum, we insert some special event cards (ex. Intro VP card)
  let numSpecialCards = currentUser ? 1 : 2
  // hide them on other forums, and when certain filters are set
  if (!isEAForum || modeFilter === 'in-person' || (formatFilter.length > 0 && !formatFilter.includes('course'))) {
    numSpecialCards = 0
  }

  const filters: Omit<PostsViewTerms, 'view'> = {}
  if (modeFilter === 'in-person') {
    filters.onlineEvent = false
  } else if (modeFilter === 'online') {
    filters.onlineEvent = true
  }
  if (formatFilter.length) {
    filters.eventType = formatFilter
  }
  if (distance) {
    // convert distance to miles if necessary
    filters.distance = (distanceUnit === 'mi') ? distance : (distance * 0.621371)
  }
  
  const eventsListTerms: PostsViewTerms = userLocation.known ? {
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
    limit: 12 - numSpecialCards,
    itemsPerPage: 12,
    skip: userLocation.loading
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
    {preferredHeadingCase("Load More")}
  </button>
  if (loading && results?.length) {
    loadMoreButton = <div className={classes.loading}><Loading /></div>
  }

  return (
    <AnalyticsContext pageContext="EventsHome">
      <div>
        <HighlightedEventCard event={highlightedEvent} loading={loading || userLocation.loading} />
      </div>

      <div className={classes.section}>
        <div className={classes.sectionHeadingRow}>
          <h1 className={classes.sectionHeading}>
            Events
          </h1>
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
                      placeholder="search for a location"
                      onSuggestSelect={(suggestion) => {
                        if (suggestion?.location) {
                          saveUserLocation({
                            ...suggestion.location,
                            gmaps: suggestion.gmaps
                          })
                        }
                      }}
                      initialValue={userLocation?.label}
                    />
                  </div>
              }
            </div>
          </div>
          
          <div className={classes.filters}>
            <FilterIcon className={classes.filterIcon} />
            
            <div className={classes.distanceFilter}>
              Within
              <Input type="number"
                value={distance}
                placeholder="distance"
                onChange={handleChangeDistance}
                className={classes.distanceInput}
              />
              <DistanceUnitToggle distanceUnit={distanceUnit} onChange={handleChangeDistanceUnit} skipDefaultEffect />
            </div>
            
            <Select
              className={classes.filter}
              value={modeFilter}
              input={<OutlinedInput labelWidth={0} />}
              onChange={(e) => setModeFilter(e.target.value)}>
                <MenuItem key="all" value="all">In-person and online</MenuItem>
                <MenuItem key="in-person" value="in-person">In-person only</MenuItem>
                <MenuItem key="online" value="online">Online only</MenuItem>
            </Select>

            <Select
              className={classNames(classes.filter, classes.formatFilter)}
              value={formatFilter}
              input={<OutlinedInput labelWidth={0} />}
              onChange={e => {
                // MUI documentation says e.target.value is always an array: https://mui.com/components/selects/#multiple-select
                // @ts-ignore
                setFormatFilter(e.target.value)
              }}
              multiple
              displayEmpty
              renderValue={(selected: Array<string>) => {
                if (selected.length === 0) {
                  return <em className={classes.placeholder}>Filter by format</em>
                }
                // if any options are selected, display them separated by commas
                return selected.map(type => EVENT_TYPES.find(t => t.value === type)?.label).join(', ')
              }}>
                {EVENT_TYPES.map(type => {
                  return <MenuItem key={type.value} value={type.value}>
                    <Checkbox checked={formatFilter.some(format => format === type.value)} />
                    <ListItemText primary={type.label} />
                  </MenuItem>
                })}
            </Select>
            
            <div className={classes.notifications}>
              <Button variant="text" color="primary" onClick={openEventNotificationsForm} className={classes.notificationsBtn}>
                {currentUser?.nearbyEventsNotifications ?
                  <ForumIcon icon="Bell" className={classes.notificationsIcon} /> :
                  <ForumIcon icon="BellBorder" className={classes.notificationsIcon} />} Notify me
              </Button>
            </div>
          </div>

          <EventCards events={results || []} loading={loading || userLocation.loading} numDefaultCards={6} hideSpecialCards={!numSpecialCards} />
          
          <div className={classes.loadMoreRow}>
            {loadMoreButton}
          </div>
        </div>
        
      </div>
    </AnalyticsContext>
  )
}

export default registerComponent('EventsHome', EventsHome, {styles});


