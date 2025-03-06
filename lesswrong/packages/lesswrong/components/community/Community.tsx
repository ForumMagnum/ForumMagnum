import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState, useEffect, useRef } from 'react';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useDialog } from '../common/withDialog'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useGoogleMaps, geoSuggestStyles } from '../form-components/LocationFormComponent';
import Geosuggest from 'react-geosuggest';
import { pickBestReverseGeocodingResult } from '../../lib/geocoding';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { isFriendlyUI } from '../../themes/forumTheme';
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import CommunityBanner from "@/components/community/modules/CommunityBanner";
import LocalGroups from "@/components/community/modules/LocalGroups";
import OnlineGroups from "@/components/community/modules/OnlineGroups";
import CommunityMembers from "@/components/community/modules/CommunityMembers";
import GroupFormLink from "@/components/localGroups/GroupFormLink";
import DistanceUnitToggle from "@/components/community/modules/DistanceUnitToggle";
import ForumIcon from "@/components/common/ForumIcon";
import { Button, OutlinedInput, Tab, Tabs, Chip } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  section: {
    maxWidth: 1200,
    margin: 'auto',
  },
  sectionHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 800,
    padding: '0 20px',
    margin: '0 auto 40px',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      marginTop: 30,
    },
    [theme.breakpoints.up('sm')]: {
      marginTop: isFriendlyUI ? 20 : undefined,
    },
  },
  sectionHeading: {
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
    [theme.breakpoints.down('sm')]: {
      marginTop: 20,
      marginLeft: 0
    },
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 10,
    rowGap: '15px',
    minHeight: 47,
    marginTop: 15,
    '@media (max-width: 1200px)': {
      padding: '0 20px',
    },
    [theme.breakpoints.down('sm')]: {
      padding: '0 6px',
    },
  },
  activeFilterChip: {
    marginTop: 5
  },
  keywordSearch: {
    maxWidth: '100%',
  },
  keywordSearchInput: {
    width: 350,
    maxWidth: '100%',
    verticalAlign: 'sub',
    paddingLeft: 10,
    '& input': {
      padding: '15px 14px 15px 0'
    }
  },
  searchIcon: {
    color: theme.palette.primary.main,
    marginRight: 6
  },
  where: {
    display: 'inline-block',
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.grey[700],
    paddingLeft: 3
  },
  whereTextDesktop: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  whereTextMobile: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'inline'
    }
  },
  geoSuggest: {
    ...geoSuggestStyles(theme),
    display: 'inline-block',
    marginLeft: 6
  },
  notifications: {
    flex: '1 0 0',
    textAlign: 'right',
    [theme.breakpoints.down('md')]: {
      display: 'none'
    }
  },
  notificationsBtn: {
    textTransform: 'none',
    fontSize: 14,
  },
  notificationsIcon: {
    fontSize: 18,
    marginRight: 6
  },
  tabs: {
    maxWidth: 634,
    margin: '0 auto 40px',
    '& .MuiTab-labelContainer': {
      fontSize: '1rem'
    }
  },
  localGroupsBtns: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 20,
    '@media (max-width: 1200px)': {
      padding: '0 20px',
    },
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  localGroupsBtn: {
    textTransform: 'none',
    fontSize: isFriendlyUI ? 13 : 12,
  },
  localGroupsBtnIcon: {
    fontSize: 15,
    marginLeft: 8
  },
  localGroupsBtnEmailIcon: {
    fontSize: 20,
    marginLeft: 10,
    marginRight: 5
  },
  eventsPageLinkRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    ...theme.typography.commentStyle,
    marginTop: 40,
    '@media (max-width: 1200px)': {
      padding: '0 20px',
    },
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  eventsPagePrompt: {
    color: theme.palette.grey[600],
    fontSize: 14,
    marginRight: 16
  },
  eventsPageLink: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.invertedBackgroundText,
    fontSize: isFriendlyUI ? 14 : 13,
    padding: '8px 16px',
    borderRadius: 4,
    marginTop: 10
  },
  addGroup: {
    marginTop: 40
  },
});

const Community = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const navigate = useNavigate();
  const { location, query } = useLocation();
  const { captureEvent } = useTracking();
  
  // local, online, or individuals
  const [tab, setTab] = useState('local')
  const [distanceUnit, setDistanceUnit] = useState<"km"|"mi">('km')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(query?.includeInactive === 'true')
  
  useEffect(() => {
    // unfortunately the hash is unavailable on the server, so we check it here instead
    if (location.hash === '#online') {
      setTab('online')
    } else if (location.hash === '#individuals') {
      setTab('individuals')
    }
    
    // only US and UK default to miles - everyone else defaults to km
    // (this is checked here to allow SSR to work properly)
    if (['en-US', 'en-GB'].some(lang => lang === window?.navigator?.language)) {
      setDistanceUnit('mi')
    }
    
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        selector: {_id: currentUser._id},
        data: {
          location: gmaps?.formatted_address,
          googleLocation: gmaps
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
  
  const keywordSearchTimer = useRef<any>(null)

  const openEventNotificationsForm = () => {
    openDialog({
      componentName: currentUser ? "EventNotificationsDialog" : "LoginPopup",
    });
  }
  
  const openSetPersonalLocationForm = () => {
    openDialog({
      componentName: currentUser ? "SetPersonalMapLocationDialog" : "LoginPopup",
    });
  }
  const handleChangeTab = (e: React.ChangeEvent, value: string) => {
    setTab(value)
    setKeywordSearch('')
    navigate({...location, hash: `#${value}`}, {replace: true})
  }
  
  const handleKeywordSearch = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newKeyword = e.target.value
    setKeywordSearch(newKeyword)
    // log the event after typing has stopped for 1 second
    clearTimeout(keywordSearchTimer.current)
    keywordSearchTimer.current = setTimeout(
      () => captureEvent(`keywordSearchGroups`, {tab, keyword: newKeyword}),
      1000
    )
  }
  
  const handleToggleIncludeInactive = () => {
    setIncludeInactive(!includeInactive)
    navigate({...location, search: `?includeInactive=${!includeInactive}`}, {replace: true})
  }
  
  const canCreateGroups = currentUser && userIsAdmin(currentUser)

  return (
    <AnalyticsContext pageContext="Community">
        
      <CommunityBanner />

      <div className={classes.section}>
        <Tabs value={tab} onChange={handleChangeTab} className={classes.tabs} scrollable aria-label='view local or online groups, or individual community members'>
          <Tab label="Local Groups" value="local" />
          <Tab label="Online Groups" value="online" />
          <Tab label="Community Members" value="individuals" />
        </Tabs>
        
        {tab === 'local' && <div key="local">
          <div className={classes.filtersRow}>
            <div className={classes.keywordSearch}>
              <OutlinedInput
                labelWidth={0}
                startAdornment={<ForumIcon icon="Search" className={classes.searchIcon}/>}
                placeholder="Search groups"
                onChange={handleKeywordSearch}
                className={classes.keywordSearchInput}
              />
            </div>

            <div>
              <div className={classes.where}>
                <span className={classes.whereTextDesktop}>Groups near</span>
                <span className={classes.whereTextMobile}>Near</span>
                {mapsLoaded
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
              {userLocation.known && <DistanceUnitToggle distanceUnit={distanceUnit} onChange={setDistanceUnit} skipDefaultEffect />}
            </div>
              
            <div className={classes.notifications}>
              <Button variant="text" color="primary" onClick={openEventNotificationsForm} className={classes.notificationsBtn}>
                {currentUser?.nearbyEventsNotifications ?
                  <ForumIcon icon="Bell" className={classes.notificationsIcon} /> :
                  <ForumIcon icon="BellBorder" className={classes.notificationsIcon} />
                } Notify me
              </Button>
            </div>
          </div>
          {includeInactive && <div className={classes.filtersRow}>
            <Chip variant="outlined" color="primary" label="Include inactive groups" onDelete={handleToggleIncludeInactive} className={classes.activeFilterChip} />
          </div>}
          
          <LocalGroups
            keywordSearch={keywordSearch}
            userLocation={userLocation}
            distanceUnit={distanceUnit}
            includeInactive={includeInactive}
            toggleIncludeInactive={handleToggleIncludeInactive}
          />
          
          <div className={classes.localGroupsBtns}>
            <Button href="https://resources.eagroups.org"
              variant="outlined" color="primary" target="_blank" rel="noopener noreferrer" className={classes.localGroupsBtn}
            >
              Start a new group
              <OpenInNewIcon className={classes.localGroupsBtnIcon} />
            </Button>
            <Button href="https://docs.google.com/forms/d/e/1FAIpQLScMolewy1P1z9XNyFIN1mQFZQ1LE64QXJrIaX6enrfItWR9LQ/viewform"
              color="primary" target="_blank" rel="noopener noreferrer" className={classes.localGroupsBtn}
            >
              Claim your group, or add a missing group
              <OpenInNewIcon className={classes.localGroupsBtnIcon} />
            </Button>
          </div>
          
          <div className={classes.eventsPageLinkRow}>
            <div className={classes.eventsPagePrompt}>Want to see what's happening now?</div>
            <Link to="/events" className={classes.eventsPageLink}>Explore all upcoming events</Link>
          </div>
        </div>}
        
        {tab === 'online' && <div key="online">
          <div className={classes.filtersRow}>
            <div className={classes.keywordSearch}>
              <OutlinedInput
                labelWidth={0}
                startAdornment={<ForumIcon icon="Search" className={classes.searchIcon}/>}
                placeholder="Search groups"
                onChange={handleKeywordSearch}
                className={classes.keywordSearchInput}
              />
            </div>
          </div>
          {includeInactive && <div className={classes.filtersRow}>
            <Chip variant="outlined" color="primary" label="Include inactive groups" onDelete={handleToggleIncludeInactive} className={classes.activeFilterChip} />
          </div>}
          
          <OnlineGroups keywordSearch={keywordSearch} includeInactive={includeInactive} toggleIncludeInactive={handleToggleIncludeInactive} />
        </div>}
        
        {tab === 'individuals' && <div key="individuals">
          <CommunityMembers
            currentUser={currentUser}
            userLocation={userLocation}
            distanceUnit={distanceUnit}
            locationFilterNode={(
              <div>
                <div className={classes.where}>
                  <span className={classes.whereTextDesktop}>People near</span>
                  <span className={classes.whereTextMobile}>Near</span>
                  {mapsLoaded
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
                {userLocation.known && <DistanceUnitToggle distanceUnit={distanceUnit} onChange={setDistanceUnit} skipDefaultEffect />}
              </div>
            )}
          />
          
          <div className={classes.localGroupsBtns}>
            <Button variant="outlined" color="primary" className={classes.localGroupsBtn} onClick={openSetPersonalLocationForm}>
              {currentUser?.mapLocation ? "Edit my location on the map" : "Add me to the map"}
            </Button>
          </div>
        </div>}
        
        {tab !== 'individuals' && <>
          {canCreateGroups && <div className={classes.addGroup} title="Currently only visible to admins">
            <GroupFormLink isOnline={tab === 'online'} />
          </div>}
        </>}
      </div>
    </AnalyticsContext>
  )
}

const CommunityComponent = registerComponent('Community', Community, {styles});

declare global {
  interface ComponentTypes {
    Community: typeof CommunityComponent
  }
}

export default CommunityComponent;
