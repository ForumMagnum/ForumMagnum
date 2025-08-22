import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { MouseEventHandler } from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { cloudinaryCloudNameSetting } from '../../../lib/publicSettings';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useThemeColor } from '@/components/themes/useTheme';
import CommunityMapWrapper from "../../localGroups/CommunityMapWrapper";
import CloudinaryImage2 from "../../common/CloudinaryImage2";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const localGroupsHomeFragmentMultiQuery = gql(`
  query multiLocalgroupLocalGroupsQuery($selector: LocalgroupSelector, $limit: Int, $enableTotal: Boolean) {
    localgroups(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...localGroupsHomeFragment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
  includeInactiveBtn: {
    textTransform: 'none',
    fontSize: 14,
  },
  localGroups: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    marginTop: 20,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
      marginLeft: -8,
      marginRight: -8,
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
    borderColor: theme.palette.greyAlpha(.1),
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
    backgroundColor: theme.palette.background.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'flex'
    },
  },
  localGroupContent: {
    height: 115,
    background: theme.palette.panelBackground.default,
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
    ...theme.typography[theme.isFriendlyUI ? "headerStyle" : "headline"],
    fontSize: 18,
    fontWeight: theme.isFriendlyUI ? 700 : undefined,
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginBottom: 0
  },
  inactiveGroupTag: {
    color: theme.palette.grey[500],
    marginRight: 10
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
    color: theme.palette.text.slightlyDim2,
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
  postGroupsCTA: {
    textAlign: 'center',
    padding: 20
  },
});

/**
 * Calculates the distance between the starting location and the ending location, as the crow flies
 *
 * @param {Object} start - the starting location
 * @param {number} start.lat - the starting location's latitude
 * @param {number} start.lng - the starting location's longitude
 * @param {Object} end - the ending location
 * @param {number} end.lat - the ending location's latitude
 * @param {number} end.lng - the ending location's longitude
 * @param {'km'|'mi'} distanceUnit - whether the result should be in km or miles
 * @returns {number}
 */
export const distance = (
  start: {lat: number, lng: number},
  end: {lat: number, lng: number},
  distanceUnit: 'km'|'mi',
) => {
  const toRad = (num: number) => num * Math.PI / 180
  
  const dLat = toRad(end.lat - start.lat)
  const dLng = toRad(end.lng - start.lng)
  const a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + (Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)))
  const distanceInKm = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371

  return Math.round(distanceUnit === 'mi' ? distanceInKm * 0.621371 : distanceInKm)
}

const LocalGroups = ({keywordSearch, userLocation, distanceUnit='km', includeInactive, toggleIncludeInactive, classes}: {
  keywordSearch: string,
  userLocation: {
    lat: number,
    lng: number,
    known: boolean,
    loading: boolean,
  },
  distanceUnit: 'km'|'mi',
  includeInactive: boolean,
  toggleIncludeInactive: MouseEventHandler,
  classes: ClassesType<typeof styles>,
}) => {
  const defaultBackground = useThemeColor(theme => theme.palette.panelBackground.default);
  const dimBackground = useThemeColor(theme => theme.palette.background.primaryDim);

  const groupsListTerms: LocalgroupsViewTerms = userLocation.known ? {
    view: 'nearby',
    lat: userLocation.lat,
    lng: userLocation.lng,
    includeInactive,
  } : {
    view: 'local',
    includeInactive,
  }
  
  const { view, limit, ...selectorTerms } = groupsListTerms;
  const { data, loading } = useQuery(localGroupsHomeFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 300,
      enableTotal: false,
    },
    skip: userLocation.loading,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.localgroups?.results;
  
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()
  
  // filter the list of groups if the user has typed in a keyword
  let localGroups = results
  if (results && keywordSearch) {
    localGroups = results.filter(group => (
      `${group.name?.toLowerCase()} ${group.nameInAnotherLanguage?.toLowerCase() ?? ''} ${group.location?.toLowerCase() ?? ''}`.includes(keywordSearch.toLowerCase())
    ))
  }

  return (
    <div className={classes.localGroups}>
      {(!loading && !localGroups?.length) ? <div className={classes.noResults}>
        <div className={classes.noResultsText}>No local groups matching your search</div>
        <div className={classes.noResultsCTA}>
          {includeInactive ? <Link to={'/events'} className={classes.eventsLink}>
            Find an upcoming event near you
          </Link> : <Button color="primary" onClick={toggleIncludeInactive} className={classes.includeInactiveBtn}>
            Search inactive groups
          </Button>}
        </div>
      </div> : <div className={classes.localGroupsList}>
        {localGroups?.map(group => {
          const rowStyle = group.bannerImageId ? {
            backgroundImage: `linear-gradient(to right, transparent, ${defaultBackground} 140px), url(https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_crop,g_custom/c_fill,h_115,w_140,q_auto,f_auto/${group.bannerImageId})`
          } : {
            backgroundImage: `url(https://res.cloudinary.com/cea/image/upload/c_pad,h_80,w_140,q_auto,f_auto/ea-logo-square-1200x1200__1_.png), linear-gradient(to right, ${dimBackground}, ${defaultBackground} 140px)`
          }
          // the distance from the user's location to the group's location
          let distanceToGroup;
          if (userLocation.known && group.mongoLocation?.coordinates) {
            const groupLocation = {
              lat: group.mongoLocation.coordinates[1],
              lng: group.mongoLocation.coordinates[0]
            }
            distanceToGroup = `${distance(userLocation, groupLocation, distanceUnit)} ${distanceUnit}`
          }
          
          return <div key={group._id} className={classes.localGroup}>
            <Link to={`/groups/${group._id}`} className={classes.mobileImg}>
              {group.bannerImageId ?
                <CloudinaryImage2 height={160} width="100vw" objectFit="cover" publicId={group.bannerImageId} imgProps={{w:'600'}} /> :
                <img src="https://res.cloudinary.com/cea/image/upload/h_120,q_auto,f_auto/ea-logo-square-1200x1200__1_.png" />}
            </Link>
            <div className={classes.localGroupContent} style={rowStyle}>
              <div className={classes.localGroupNameRow}>
                <Link to={`/groups/${group._id}`} className={classes.localGroupName}>
                  {group.inactive ? <span className={classes.inactiveGroupTag}>[Inactive]</span> : null}
                  {group.name}
                </Link>
                <div className={classes.localGroupDistance}>
                  {distanceToGroup}
                </div>
              </div>
              <div className={classes.localGroupLocation}>{group.location}</div>
            </div>
          </div>
        })}
        {!includeInactive && <div className={classes.postGroupsCTA}>
          <Button color="primary" onClick={toggleIncludeInactive} className={classes.includeInactiveBtn}>
            Search inactive groups
          </Button>
        </div>}
      </div>}
      <div className={classes.localGroupsMap}>
        <CommunityMapWrapper
          mapOptions={userLocation.known ? {center: userLocation, zoom: 5} : {zoom: 1}}
          keywordSearch={keywordSearch}
          hideLegend
          showUsersByDefault={false}
        />
      </div>
    </div>
  )
}

export default registerComponent('LocalGroups', LocalGroups, {styles});


