import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { cloudinaryCloudNameSetting } from '../../../lib/publicSettings';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  noResults: {
    ...theme.typography.commentStyle,
    textAlign: 'center',
    fontSize: 18,
  },
  noResultsText: {
    marginTop: 30
  },
  noResultsCTA: {
    fontSize: 14,
    marginTop: 20
  },
  eventsLink: {
    color: theme.palette.primary.main,
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
  mobileImg: {
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
}))


const LocalGroups = ({keywordSearch, userLocation, distanceUnit='km', classes}: {
  keywordSearch: string,
  userLocation: {
    lat: number,
    lng: number,
    known: boolean,
    loading: boolean,
  },
  distanceUnit: 'km'|'mi',
  classes: ClassesType,
}) => {
  const { CommunityMapWrapper, CloudinaryImage2 } = Components
  
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
    const distanceInKm = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371
  
    return Math.round(distanceUnit === 'mi' ? distanceInKm * 0.621371 : distanceInKm)
  }

  let groupsListTerms: LocalgroupsViewTerms = {}
  groupsListTerms = userLocation.known ? {
    view: 'nearby',
    lat: userLocation.lat,
    lng: userLocation.lng,
  } : {
    view: 'local',
  }
  
  const { results, loading } = useMulti({
    terms: groupsListTerms,
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    limit: 200,
    skip: userLocation.loading
  });
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()
  
  // filter the list of groups if the user has typed in a keyword
  let localGroups = results
  if (results && keywordSearch) {
    localGroups = results.filter(group => (
      `${group.name.toLowerCase()} ${group.location.toLowerCase()}`.includes(keywordSearch.toLowerCase())
    ))
  }

  return (
    <div className={classes.localGroups}>
      {(!loading && !localGroups?.length) ? <div className={classes.noResults}>
        <div className={classes.noResultsText}>No local groups matching your search</div>
        <div className={classes.noResultsCTA}>
          <Link to={'/events'} className={classes.eventsLink}>
            Find an upcoming event near you
          </Link>
        </div>
      </div> : <div className={classes.localGroupsList}>
        {localGroups?.map(group => {
          const rowStyle = group.bannerImageId ? {
            backgroundImage: `linear-gradient(to right, transparent, white 140px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,g_custom,h_115,w_140,q_auto,f_auto/${group.bannerImageId})`
          } : {
            backgroundImage: 'url(https://res.cloudinary.com/cea/image/upload/c_pad,h_80,w_140,q_auto,f_auto/ea-logo-square-1200x1200__1_.png), linear-gradient(to right, #e2f1f4, white 140px)'
          }
          // the distance from the user's location to the group's location
          let distanceToGroup;
          if (userLocation.known && group.mongoLocation?.coordinates) {
            distanceToGroup = `${distance(group.mongoLocation.coordinates[1], group.mongoLocation.coordinates[0])} ${distanceUnit}`
          }
          
          return <div key={group._id} className={classes.localGroup}>
            <Link to={`/groups/${group._id}`} className={classes.mobileImg}>
              {group.bannerImageId ?
                <CloudinaryImage2 height={160} width="100vw" objectFit="cover" publicId={group.bannerImageId} imgProps={{w:'600'}} /> :
                <img src="https://res.cloudinary.com/cea/image/upload/h_120,q_auto,f_auto/ea-logo-square-1200x1200__1_.png" />}
            </Link>
            <div className={classes.localGroupContent} style={rowStyle}>
              <div className={classes.localGroupNameRow}>
                <Link to={`/groups/${group._id}`} className={classes.localGroupName}>{group.name}</Link>
                <div className={classes.localGroupDistance}>
                  {distanceToGroup}
                </div>
              </div>
              <div className={classes.localGroupLocation}>{group.location}</div>
            </div>
          </div>
        })}
      </div>}
      <div className={classes.localGroupsMap}>
        <CommunityMapWrapper
          mapOptions={userLocation.known ? {center: userLocation, zoom: 5} : {zoom: 1}}
          keywordSearch={keywordSearch}
          hideLegend
          showUsers={false}
        />
      </div>
    </div>
  )
}

const LocalGroupsComponent = registerComponent('LocalGroups', LocalGroups, {styles});

declare global {
  interface ComponentTypes {
    LocalGroups: typeof LocalGroupsComponent
  }
}
