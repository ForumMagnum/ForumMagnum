import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog';
import Button from '@material-ui/core/Button';
import { getSearchClient } from '../../../lib/algoliaUtil';
import { Configure, connectSearchBox, Hits, InstantSearch, SearchBox } from 'react-instantsearch-dom';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Search from '@material-ui/icons/Search';

const styles = createStyles((theme: ThemeType): JssStyles => ({
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
  noResults: {
    ...theme.typography.commentStyle,
    textAlign: 'center',
    fontSize: 18,
    padding: 16
  },
  noResultsText: {
    marginTop: 16
  },
  noResultsCTA: {
    fontSize: 14,
    marginTop: 20
  },
  eventsLink: {
    color: theme.palette.primary.main,
  },
  people: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    marginTop: 20,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
      marginLeft: -4,
      marginRight: -4,
    }
  },
  peopleList: {
    height: 440,
    overflowY: 'scroll',
    [theme.breakpoints.down('sm')]: {
      height: 'auto',
    },
  },
  person: {
    background: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: theme.palette.grey[300],
  },
  content: {
    padding: 16,
    [theme.breakpoints.down('xs')]: {
      paddingBottom: 30
    },
  },
  nameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  displayName: {
    ...theme.typography.headline,
    fontSize: 18,
    fontWeight: 'bold',
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginBottom: 0
  },
  distance: {
    flex: 'none',
    ...theme.typography.commentStyle,
    color: theme.palette.primary.dark,
    fontSize: 14,
    marginLeft: 14
  },
  location: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    fontSize: 12,
    fontStyle: 'italic',
    overflow: 'hidden',
    marginTop: 4,
  },
  description: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    fontSize: 14,
    lineHeight: '1.8em',
    whiteSpace: 'pre-wrap',
    display: '-webkit-box',
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    marginTop: 50,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  bottomBtns: {
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
  bottomBtn: {
    textTransform: 'none',
    fontSize: 12
  },
}))


const CommunityMembers = ({keywordSearch, userLocation, distanceUnit='km', currentUser, classes}: {
  keywordSearch: string,
  userLocation: {
    lat: number,
    lng: number,
    known: boolean,
    loading: boolean,
  },
  distanceUnit: 'km'|'mi',
  currentUser: UsersCurrent | null,
  classes: ClassesType,
}) => {
  const { openDialog } = useDialog()
  const { CommunityMapWrapper } = Components
  
  const openSetPersonalLocationForm = () => {
    openDialog({
      componentName: currentUser ? "SetPersonalMapLocationDialog" : "LoginPopup",
      componentProps: {onSubmit: () => {console.log('refetch');refetch()}}
    });
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
    const distanceInKm = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371
  
    return Math.round(distanceUnit === 'mi' ? distanceInKm * 0.621371 : distanceInKm)
  }
  
  const SearchBox = ({currentRefinement, refine}) => {
    return <div className={classes.keywordSearch}>
      <OutlinedInput
        labelWidth={0}
        startAdornment={<Search className={classes.searchIcon}/>}
        placeholder="Search people"
        value={currentRefinement}
        onChange={e => refine(e.currentTarget.value)}
        className={classes.keywordSearchInput}
      />
    </div>
  }
  const CustomSearchBox = connectSearchBox(SearchBox)
  
  const CommunityMember = ({hit}: {
    hit: AlgoliaUser,
  }) => {
    // the distance from the user's location to the person's location
    let distanceToPerson;
    if (userLocation.known) {
      distanceToPerson = `${distance(hit._geoloc?.lat, hit._geoloc?.lng)} ${distanceUnit}`
    }
    
    return <div className={classes.person}>
      <div className={classes.content}>
        <div className={classes.nameRow}>
          <Link to={`/users/${hit.slug}`} className={classes.displayName}>{hit.displayName}</Link>
          <div className={classes.distance}>
            {distanceToPerson}
          </div>
        </div>
        <div className={classes.location}>{hit.mapLocationAddress}</div>
        {hit.bio && <div className={classes.description}>{hit.bio}</div>}
      </div>
    </div>
  }
  
  return <InstantSearch
    indexName={'test_users'}
    searchClient={getSearchClient()}
  >
    <CustomSearchBox />
    <div className={classes.people} >
      <Hits hitComponent={CommunityMember} />
      <div className={classes.map}>
        <CommunityMapWrapper
          mapOptions={userLocation.known ? {center: userLocation, zoom: 9} : {zoom: 1}}
          keywordSearch={keywordSearch}
          hideLegend
          showLocalGroups={false}
          showUsers
        />
      </div>
    </div>
    <Configure aroundLatLng={`${userLocation?.lat}, ${userLocation.lng}`} />
  </InstantSearch>

  let usersListTerms: UsersViewTerms = {}
  usersListTerms = userLocation.known ? {
    view: 'nearby',
    lat: userLocation.lat,
    lng: userLocation.lng,
  } : {
    view: 'usersMapLocations',
  }
  
  const { results, loading, refetch } = useMulti({
    terms: usersListTerms,
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
    limit: 200,
    skip: userLocation.loading
  });
    
  // filter the list of people if the user has typed in a keyword
  let people = results
  if (results && keywordSearch) {
    people = results.filter(person => (
      `${person.displayName.toLowerCase()} ${person.bio?.toLowerCase()}`.includes(keywordSearch.toLowerCase())
    ))
  }

  return (
    <>
    <div className={classes.people}>
      {(!loading && !people?.length) ? <div className={classes.noResults}>
        <div className={classes.noResultsText}>No community members matching your search</div>
        <div className={classes.noResultsCTA}>
          <Link to={'/events'} className={classes.eventsLink}>
            Join an upcoming event near you
          </Link>
        </div>
      </div> : <div className={classes.peopleList}>
        {people?.map(person => {
          // the distance from the user's location to the person's location
          let distanceToPerson;
          if (userLocation.known && person.mapLocation.geometry.location) {
            distanceToPerson = `${distance(person.mapLocation.geometry.location.lat, person.mapLocation.geometry.location.lng)} ${distanceUnit}`
          }
          
          return <div key={person._id} className={classes.person}>
            <div className={classes.content}>
              <div className={classes.nameRow}>
                <Link to={`/users/${person.slug}`} className={classes.displayName}>{person.displayName}</Link>
                <div className={classes.distance}>
                  {distanceToPerson}
                </div>
              </div>
              <div className={classes.location}>{person.mapLocation.formatted_address}</div>
              {person.bio && <div className={classes.description}>{person.bio}</div>}
            </div>
          </div>
        })}
      </div>}
      <div className={classes.map}>
        <CommunityMapWrapper
          mapOptions={userLocation.known ? {center: userLocation, zoom: 9} : {zoom: 1}}
          keywordSearch={keywordSearch}
          hideLegend
          showLocalGroups={false}
          showUsers
        />
      </div>
    </div>
    
    <div className={classes.bottomBtns}>
      <Button variant="outlined" color="primary" className={classes.bottomBtn} onClick={openSetPersonalLocationForm}>
        {currentUser?.mapLocation ? "Edit my location on the map" : "Add me to the map"}
      </Button>
    </div>
    </>
  )
}

const CommunityMembersComponent = registerComponent('CommunityMembers', CommunityMembers, {styles});

declare global {
  interface ComponentTypes {
    CommunityMembers: typeof CommunityMembersComponent
  }
}

