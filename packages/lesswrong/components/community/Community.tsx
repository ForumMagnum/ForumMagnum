import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { useState, useEffect } from 'react';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import LinkIcon from '@material-ui/icons/Link';
import { useDialog } from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useUpdate } from '../../lib/crud/withUpdate';
import { pickBestReverseGeocodingResult } from '../../server/mapsUtils';
import { useGoogleMaps, geoSuggestStyles } from '../form-components/LocationFormComponent';
import { useMulti } from '../../lib/crud/withMulti';
import { getBrowserLocalStorage } from '../async/localStorageHandlers';
import Geosuggest from 'react-geosuggest';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Link } from '../../lib/reactRouterWrapper';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { FacebookIcon, SlackIcon } from '../localGroups/GroupLinks';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import Button from '@material-ui/core/Button';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import EmailIcon from '@material-ui/icons/MailOutline';

const styles = createStyles((theme: ThemeType): JssStyles => ({
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
  },
  sectionHeading: {
    ...theme.typography.headline,
    fontSize: 34,
    margin: 0
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
  bannerImg: {
    width: '100vw',
    height: 200,
    backgroundImage: "linear-gradient(to right, rgba(0, 87, 102, 1), transparent), url(https://res.cloudinary.com/cea/image/upload/c_fill,h_300,w_1200,q_auto,f_auto/236225045_2995791057331456_5749161116892625450_n.jpg.jpg)",
    backgroundSize: 'cover',
    backgroundPosition: 'top right',
    marginBottom: 10,
    [theme.breakpoints.down('sm')]: {
      height: 200,
      marginLeft: -4,
      marginRight: -4,
    }
  },
  filters: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    columnGap: 10,
    marginTop: 10,
  },
  where: {
    flex: '1 0 0',
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: "rgba(0,0,0,0.6)",
    paddingLeft: 3
  },
  geoSuggest: {
    ...geoSuggestStyles(theme),
    display: 'inline-block',
    maxWidth: 200,
    marginLeft: 6
  },
  filter: {
  },
  notifications: {
    textAlign: 'right',
    [theme.breakpoints.down('xs')]: {
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
    marginBottom: 40,
    '& .MuiTab-labelContainer': {
      fontSize: '1rem'
    }
  },
  localGroups: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    marginTop: 20,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
      marginLeft: -4,
      marginRight: -4,
    }
  },
  localGroupsList: {
    height: 440,
    overflowY: 'scroll',
    [theme.breakpoints.down('sm')]: {
      height: 'auto',
    },
  },
  localGroup: {
    height: 116,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: "rgba(0, 0, 0, 0.1)",
    '&:last-of-type': {
      borderBottom: 'none'
    },
    [theme.breakpoints.down('xs')]: {
      height: 'auto'
    },
  },
  localGroupMobileImg: {
    display: 'none',
    height: 160,
    backgroundColor: '#e2f1f4',
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'flex'
    },
  },
  localGroupContent: {
    height: 115,
    background: 'white',
    backgroundRepeat: 'no-repeat',
    backgroundPositionY: 'center',
    padding: '16px 16px 16px 150px',
    [theme.breakpoints.down('xs')]: {
      height: 'auto',
      backgroundImage: 'none !important',
      paddingLeft: 16,
      paddingBottom: 30
    },
  },
  localGroupNameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  localGroupName: {
    ...theme.typography.headline,
    fontSize: 18,
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginBottom: 0
  },
  localGroupDistance: {
    flex: 'none',
    ...theme.typography.commentStyle,
    color: theme.palette.primary.dark,
    fontSize: 14,
    marginLeft: 14
  },
  localGroupLocation: {
    ...theme.typography.commentStyle,
    color: "rgba(0, 0, 0, 0.7)",
    fontSize: 14,
    lineHeight: '1.5em',
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 8,
  },
  localGroupsMap: {
    marginTop: 50,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
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
    fontSize: 12
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
  onlineGroups: {
    [theme.breakpoints.down('sm')]: {
      marginLeft: -4,
      marginRight: -4,
    }
  },
  onlineGroup: {
    height: 116,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: "rgba(0, 0, 0, 0.1)",
    '&:last-of-type': {
      borderBottom: 'none'
    },
    [theme.breakpoints.down('xs')]: {
      height: 'auto'
    },
  },
  onlineGroupContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 115,
    background: 'white',
    backgroundRepeat: 'no-repeat',
    backgroundPositionY: 'center',
    padding: '15px 20px 15px 204px',
    '@media (max-width: 730px)': {
      paddingLeft: 94
    },
    [theme.breakpoints.down('xs')]: {
      display: 'block',
      height: 'auto',
      backgroundImage: 'none !important',
      paddingLeft: 4,
      paddingBottom: 30
    },
  },
  onlineGroupText: {
    backgroundColor: 'white',
    minWidth: 0,
    padding: '6px 15px',
  },
  onlineGroupNameRow: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    [theme.breakpoints.down('xs')]: {
      whiteSpace: 'normal'
    }
  },
  onlineGroupName: {
    ...theme.typography.headline,
    fontSize: 20,
  },
  onlineGroupDescription: {
    ...theme.typography.commentStyle,
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: 14,
    lineHeight: '1.6em',
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 8,
    [theme.breakpoints.down('xs')]: {
      "-webkit-line-clamp": 4,
    },
  },
  onlineGroupJoin: {
    alignSelf: 'center',
    flex: 'none',
    marginLeft: 14,
    [theme.breakpoints.down('xs')]: {
      textAlign: 'right',
      marginTop: 16,
      marginLeft: 0
    }
  },
  onlineGroupBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 80,
    ...theme.typography.commentStyle,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    padding: '10px 16px',
    borderRadius: 4,
  },
  onlineGroupBtnIcon: {
    fontSize: 13,
    marginRight: 8
  },
  onlineGroupBtnIconWebsite: {
    transform: "translateY(3px) rotate(-45deg)",
    fontSize: 15,
    marginTop: -7,
    marginRight: 8
  }
}))


const Community = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { history } = useNavigation();
  const { location } = useLocation();
  
  // local or online
  const [tab, setTab] = useState('local')
  
  useEffect(() => {
    // unfortunately the hash is unavailable on the server, so we check it here instead
    if (location.hash === '#online') {
      setTab('online')
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
   const saveUserLocation = ({lat, lng, gmaps}) => {
    // save it in the page state
    userLocation.setLocationData({lat, lng, loading: false, known: true, label: gmaps.formatted_address})

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
    openDialog({
      componentName: currentUser ? "EventNotificationsDialog" : "LoginPopup",
    });
  }
  
  const { CommunityMapWrapper, CloudinaryImage2 } = Components
  
  const handleChangeTab = (e, value) => {
    setTab(value)
    history.replace({...location, hash: `#${value}`})
  }
  
  /**
   * Calculates the distance between the query location and the given lat/lng, as the crow flies
   *
   * @param {number} lat - latitude
   * @param {number} lng - longitude
   * @returns {number}
   */
  const distance = (lat, lng) => {
    if (!userLocation) return null
    
    const toRad = (num) => num * Math.PI / 180
    
    const dLat = toRad(lat - userLocation.lat)
    const dLng = toRad(lng - userLocation.lng)
    const a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + (Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(lat)))
    return Math.round(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371)
  }

  const filters: LocalgroupsViewTerms = {}
  
  let groupsListTerms: LocalgroupsViewTerms = {}
  if (tab === 'local') {
    groupsListTerms = userLocation.known ? {
      view: 'nearby',
      lat: userLocation.lat,
      lng: userLocation.lng,
      ...filters,
    } : {
      view: 'local',
      ...filters,
    }
  } else if (tab === 'online') {
    groupsListTerms = {
      view: 'online',
      ...filters
    }
  }
  
  const { results } = useMulti({
    terms: groupsListTerms,
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 200,
    skip: userLocation.loading
  });
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return (
    <AnalyticsContext pageContext="Community">
      
      <div className={classes.section}>
        <div className={classes.sectionHeadingRow}>
          <h1 className={classes.sectionHeading}>
            Community
          </h1>
          <div className={classes.sectionDescription}>
            Effective altruism is a global community with thousands of members. Reach out to learn how you can have the most impact.
          </div>
        </div>
      </div>
        
      <div className={classes.bannerImg}></div>

      <div className={classes.section}>
        <Tabs value={tab} onChange={handleChangeTab} className={classes.tabs} centered aria-label='view local or online groups'>
          <Tab label="Local Groups" value="local" />
          <Tab label="Online Groups" value="online" />
        </Tabs>
        
        {tab === 'local' && <div key="local" className={classes.tabBody}>
          <div className={classes.filters}>
            <div className={classes.where}>
              Showing groups near {mapsLoaded
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
                      initialValue={userLocation?.label}
                    />
                  </div>
              }
            </div>
            
            <div className={classes.notifications}>
              <Button variant="text" color="primary" onClick={openEventNotificationsForm} className={classes.notificationsBtn}>
                {currentUser?.nearbyEventsNotifications ? <NotificationsIcon className={classes.notificationsIcon} /> : <NotificationsNoneIcon className={classes.notificationsIcon} />} Notify me
              </Button>
            </div>
          </div>
          
          <div className={classes.localGroups}>
            <div className={classes.localGroupsList}>
              {results?.map(group => {
                const rowStyle = group.bannerImageId ? {
                  backgroundImage: `linear-gradient(to right, transparent, white 140px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_115,w_140,q_auto,f_auto/${group.bannerImageId})`
                } : {
                  backgroundImage: 'url(https://res.cloudinary.com/cea/image/upload/c_pad,h_80,w_140,q_auto,f_auto/ea-logo-square-1200x1200__1_.png), linear-gradient(to right, #e2f1f4, white 140px)'
                }
                
                return <div key={group._id} className={classes.localGroup}>
                  <Link to={`/groups/${group._id}`} className={classes.localGroupMobileImg}>
                    {group.bannerImageId ?
                      <CloudinaryImage2 height={160} width="100vw" objectFit="cover" publicId={group.bannerImageId} imgProps={{w:'600'}} /> :
                      <img src="https://res.cloudinary.com/cea/image/upload/h_120,q_auto,f_auto/ea-logo-square-1200x1200__1_.png" />}
                  </Link>
                  <div className={classes.localGroupContent} style={rowStyle}>
                    <div className={classes.localGroupNameRow}>
                      <Link to={`/groups/${group._id}`} className={classes.localGroupName}>{group.name}</Link>
                      <div className={classes.localGroupDistance}>
                        {userLocation.known && group.mongoLocation?.coordinates && `${distance(group.mongoLocation.coordinates[1], group.mongoLocation.coordinates[0])} km`}
                      </div>
                    </div>
                    <div className={classes.localGroupLocation}>{group.location}</div>
                  </div>
                </div>
              })}
            </div>
            <div className={classes.localGroupsMap}>
              <CommunityMapWrapper
                mapOptions={userLocation.known ? {center: userLocation, zoom: 5} : {zoom: 1}}
                hideLegend
                showUsers={false}
              />
            </div>
          </div>
          
          <div className={classes.localGroupsBtns}>
            <Button href="https://resources.eagroups.org/" variant="outlined" color="primary" target="_blank" rel="noopener noreferrer" className={classes.localGroupsBtn}>
              Start your own group
              <OpenInNewIcon className={classes.localGroupsBtnIcon} />
            </Button>
            <Button href="/contact" color="primary" className={classes.localGroupsBtn}>
              Is your group missing? <EmailIcon className={classes.localGroupsBtnEmailIcon} /> Contact us
            </Button>
          </div>
          
        </div>}
        
        {tab === 'online' && <div key="online" className={classes.tabBody}>
          <div className={classes.filters}>
          </div>
          
          <div className={classes.onlineGroups}>
            <div className={classes.onlineGroupsList}>
              {results?.map(group => {
                const rowStyle = group.bannerImageId ? {
                  backgroundImage: `linear-gradient(to right, transparent, white 200px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_115,w_200,q_auto,f_auto/${group.bannerImageId})`
                } : {
                  backgroundImage: 'url(https://res.cloudinary.com/cea/image/upload/c_pad,h_80,w_200,q_auto,f_auto/ea-logo-square-1200x1200__1_.png), linear-gradient(to right, #e2f1f4, white 200px)'
                }
                
                let cta;
                if (group.facebookLink) {
                  cta = <a href={group.facebookLink} className={classes.onlineGroupBtn}>
                    <FacebookIcon className={classes.onlineGroupBtnIcon} />
                    <div>Join</div>
                  </a>
                } else if (group.slackLink) {
                  cta = <a href={group.slackLink} className={classes.onlineGroupBtn}>
                    <SlackIcon className={classes.onlineGroupBtnIcon} />
                    <div>Join</div>
                  </a>
                } else if (group.website) {
                  cta = <a href={group.website} className={classes.onlineGroupBtn}>
                    <LinkIcon className={classes.onlineGroupBtnIconWebsite} />
                    <div>Join</div>
                  </a>
                }
                
                return <div key={group._id} className={classes.onlineGroup}>
                  <Link to={`/groups/${group._id}`} className={classes.localGroupMobileImg}>
                    {group.bannerImageId ?
                      <CloudinaryImage2 height={160} width="100vw" objectFit="cover" publicId={group.bannerImageId} imgProps={{w:'600'}} /> :
                      <img src="https://res.cloudinary.com/cea/image/upload/h_120,q_auto,f_auto/ea-logo-square-1200x1200__1_.png" />}
                  </Link>
                  <div className={classes.onlineGroupContent} style={rowStyle}>
                    <div className={classes.onlineGroupText}>
                      <div className={classes.onlineGroupNameRow}>
                        <Link to={`/groups/${group._id}`} className={classes.onlineGroupName}>{group.name}</Link>
                      </div>
                      <div className={classes.onlineGroupDescription}>{group.contents?.plaintextDescription}</div>
                    </div>
                    <div className={classes.onlineGroupJoin}>
                      {cta}
                    </div>
                  </div>
                </div>
              })}
            </div>
          </div>
        </div>}
        
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
