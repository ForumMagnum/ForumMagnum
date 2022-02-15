import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { useState, useEffect } from 'react';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import AddAlertIcon from '@material-ui/icons/AddAlert';
import LinkIcon from '@material-ui/icons/Link';
import { useDialog } from '../common/withDialog'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useUpdate } from '../../lib/crud/withUpdate';
import { pickBestReverseGeocodingResult } from '../../server/mapsUtils';
import { useGoogleMaps, geoSuggestStyles } from '../form-components/LocationFormComponent';
import { useMulti } from '../../lib/crud/withMulti';
import { getBrowserLocalStorage } from '../async/localStorageHandlers';
import Geosuggest from 'react-geosuggest';
import IconButton from '@material-ui/core/IconButton';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Link } from '../../lib/reactRouterWrapper';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { FacebookIcon, SlackIcon } from '../localGroups/GroupLinks';
import { useLocation, useNavigation } from '../../lib/routeUtil';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  section: {
    maxWidth: 1200,
    margin: 'auto',
  },
  sectionHeadingRow: {
    maxWidth: 700,
    padding: '0 20px',
    margin: '0 auto 30px',
    [theme.breakpoints.down('sm')]: {
      marginTop: 30,
    },
  },
  sectionHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    ...theme.typography.headline,
    fontSize: 34,
    margin: 0
  },
  sectionDescription: {
    ...theme.typography.commentStyle,
    textAlign: 'left',
    fontSize: 14,
    lineHeight: '1.8em',
    marginTop: 20,
  },
  filters: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 20px',
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
    [theme.breakpoints.down('md')]: {
      display: 'none'
    },
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
    height: 115,
    background: 'white',
    backgroundRepeat: 'no-repeat',
    backgroundPositionY: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: "rgba(0, 0, 0, 0.1)",
    // borderColor: '#c0a688',
    // borderColor: theme.palette.primary.main,
    padding: '16px 16px 16px 150px',
    '&:last-of-type': {
      borderBottom: 'none'
    },
  },
  localGroupNameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
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
  onlineGroups: {
    [theme.breakpoints.down('sm')]: {
      marginLeft: -4,
      marginRight: -4,
    }
  },
  onlineGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    height: 115,
    background: 'white',
    backgroundRepeat: 'no-repeat',
    backgroundPositionY: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: "rgba(0, 0, 0, 0.1)",
    padding: '20px 20px 20px 220px',
    '&:last-of-type': {
      borderBottom: 'none'
    },
  },
  onlineGroupName: {
    display: 'inline-block',
    ...theme.typography.headline,
    fontSize: 20,
    marginBottom: 0
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
  },
  onlineGroupJoin: {
    alignSelf: 'center',
    flex: 'none',
    marginLeft: 30
  },
  onlineGroupBtn: {
    display: 'flex',
    alignItems: 'center',
    ...theme.typography.commentStyle,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    padding: '10px 16px',
    borderRadius: 4,
    [theme.breakpoints.down('sm')]: {
      maxWidth: 100
    },
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
  
  // this is the actual location used for the groups query -
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
  
  // local or online
  const [tab, setTab] = useState(() => {
    return location.hash ? location.hash.replace('#','') : 'local'
  })

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
  
  const { CommunityMapWrapper } = Components
  
  const handleChangeTab = (e, value) => {
    setTab(value)
    history.replace({...location, hash: `#${value}`})
  }
  
  const distance = (lat, lng) => {
    if (!queryLocation) return null
    
    const toRad = (num) => num * Math.PI / 180
    
    const dLat = toRad(lat - queryLocation.lat)
    const dLng = toRad(lng - queryLocation.lng)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(toRad(queryLocation.lat)) * Math.cos(toRad(lat))
    return Math.round(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371)
  }

  const filters: LocalgroupsViewTerms = {}
  
  let groupsListTerms: LocalgroupsViewTerms = {}
  if (tab === 'local') {
    groupsListTerms = queryLocation ? {
      view: 'nearby',
      lat: queryLocation.lat,
      lng: queryLocation.lng,
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
  
  const { results, loading } = useMulti({
    terms: groupsListTerms,
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 200,
    skip: !queryLocation && currentUserLocation.loading
  });
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return (
    <AnalyticsContext pageContext="Community">
      
      <div className={classes.section}>
        <div className={classes.sectionHeadingRow}>
          <h1 className={classes.sectionHeading}>
            Community
            <IconButton color="primary"
              aria-label="group notifications"
              onClick={openEventNotificationsForm}
              className={classes.notificationsIcon}
            >
              <AddAlertIcon />
            </IconButton>
          </h1>
          <div className={classes.sectionDescription}>
            Effective altruism is a global community with thousands of members. Joining a group
            is a great way to meet people who want to help each other do the most good.
          </div>
        </div>

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
                      initialValue={queryLocation?.label}
                    />
                  </div>
              }
            </div>
          </div>
          
          <div className={classes.localGroups}>
            <div className={classes.localGroupsList}>
              {results?.map(group => {
                const rowStyle = group.bannerImageId ? {
                  backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.0), rgba(255, 255, 255, 1.0) 140px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_115,w_140/${group.bannerImageId})`
                } : {
                  backgroundImage: 'url(https://res.cloudinary.com/cea/image/upload/b_white,c_pad,h_80,w_140/ea-logo-square-1200x1200__1_.png)'
                }
                
                return <div key={group._id} className={classes.localGroup} style={rowStyle}>
                  <div className={classes.localGroupNameRow}>
                    <Link to={`/groups/${group._id}`} className={classes.localGroupName}>{group.name}</Link>
                    <div className={classes.localGroupDistance}>
                      {queryLocation && group.mongoLocation?.coordinates && `${distance(group.mongoLocation.coordinates[1], group.mongoLocation.coordinates[0])} km`}
                    </div>
                  </div>
                  <div className={classes.localGroupLocation}>{group.location}</div>
                </div>
              })}
            </div>
            <div className={classes.localGroupsMap}>
              <CommunityMapWrapper
                mapOptions={queryLocation ? {center: queryLocation, zoom: 5} : {zoom: 1}}
                hideLegend
                showUsers={false}
              />
            </div>
          </div>
        </div>}
        
        {tab === 'online' && <div key="online" className={classes.tabBody}>
          <div className={classes.filters}>
          </div>
          
          <div className={classes.onlineGroups}>
            <div className={classes.onlineGroupsList}>
              {results?.map(group => {
                const rowStyle = group.bannerImageId ? {
                  backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.0), rgba(255, 255, 255, 1.0) 200px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_115,w_200/${group.bannerImageId})`
                } : {
                  backgroundImage: 'url(https://res.cloudinary.com/cea/image/upload/b_white,c_pad,h_80,w_200/ea-logo-square-1200x1200__1_.png)'
                }
                
                let cta;
                if (group.facebookLink) {
                  cta = <a href={group.facebookLink} className={classes.onlineGroupBtn}>
                    <FacebookIcon className={classes.onlineGroupBtnIcon} />
                    Join
                  </a>
                } else if (group.slackLink) {
                  cta = <a href={group.slackLink} className={classes.onlineGroupBtn}>
                    <SlackIcon className={classes.onlineGroupBtnIcon} />
                    Join
                  </a>
                } else if (group.website) {
                  cta = <a href={group.website} className={classes.onlineGroupBtn}>
                    <LinkIcon className={classes.onlineGroupBtnIconWebsite} />
                    Join
                  </a>
                }
                
                return <div key={group._id} className={classes.onlineGroup} style={rowStyle}>
                  <div>
                    <div>
                      <Link to={`/groups/${group._id}`} className={classes.onlineGroupName}>{group.name}</Link>
                    </div>
                    <div className={classes.onlineGroupDescription}>{group.contents?.plaintextDescription}</div>
                  </div>
                  <div className={classes.onlineGroupJoin}>
                    {cta}
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
