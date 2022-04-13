import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React, { ReactNode } from 'react';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import { Link } from '../../../lib/reactRouterWrapper';
import { getSearchClient } from '../../../lib/algoliaUtil';
import { Configure, connectSearchBox, Hits, InstantSearch } from 'react-instantsearch-dom';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Search from '@material-ui/icons/Search';
import { distance } from './LocalGroups';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 10,
    rowGap: '20px',
    marginTop: 10,
    '@media (max-width: 1200px)': {
      padding: '0 20px',
    },
    [theme.breakpoints.down('sm')]: {
      padding: 0
    },
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
    gridTemplateColumns: '1fr 1fr',
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
    padding: 20,
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
}))


const CommunityMembers = ({keywordSearch, userLocation, distanceUnit='km', locationFilterNode, classes}: {
  keywordSearch: string,
  userLocation: {
    lat: number,
    lng: number,
    known: boolean,
    loading: boolean,
  },
  distanceUnit: 'km'|'mi',
  locationFilterNode: ReactNode,
  classes: ClassesType,
}) => {
  const { CommunityMapWrapper } = Components
  
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
    if (userLocation.known && hit._geoloc) {
      distanceToPerson = `${distance(userLocation, hit._geoloc, distanceUnit)} ${distanceUnit}`
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
    <div className={classes.filters}>
      <CustomSearchBox />
      {locationFilterNode}
    </div>
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
}

const CommunityMembersComponent = registerComponent('CommunityMembers', CommunityMembers, {styles});

declare global {
  interface ComponentTypes {
    CommunityMembers: typeof CommunityMembersComponent
  }
}

