import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React, { ReactNode } from 'react';
import { createStyles } from '@material-ui/core/styles';
import { Link } from '../../../lib/reactRouterWrapper';
import { getSearchClient } from '../../../lib/algoliaUtil';
import { Configure, connectSearchBox, connectStateResults, Hits, InstantSearch, Pagination } from 'react-instantsearch-dom';
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
    marginTop: 4,
  },
  description: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    fontSize: 14,
    lineHeight: '1.8em',
    display: '-webkit-box',
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  pagination: {
    ...theme.typography.commentStyle,
    fontSize: 16,
    marginTop: 6,
    '& li': {
      padding: 8
    },
    '& .ais-Pagination-item': {
      color: theme.palette.primary.main,
    },
    '& .ais-Pagination-item--page': {
      fontWeight: 'bold'
    },
    '& .ais-Pagination-item--selected': {
      color: theme.palette.grey[900]
    },
    '& .ais-Pagination-item--disabled': {
      color: theme.palette.grey[500]
    }
  }
}))


const CommunityMembers = ({userLocation, distanceUnit='km', locationFilterNode, classes}: {
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
  const { SearchResultsMap } = Components
  
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
  
  const StateResults = ({ searchResults }) => {
    return (!searchResults || !searchResults.nbHits) ? <div className={classes.noResults}>
      <div className={classes.noResultsText}>No public profiles matching your search</div>
    </div> : null
  }
  const CustomStateResults = connectStateResults(StateResults)
  
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
        {hit.htmlBio && <div className={classes.description}><div dangerouslySetInnerHTML={{__html: hit.htmlBio}} /></div>}
      </div>
    </div>
  }
  
  // if the user hasn't selected a location, we show the whole map
  const mapOptions = userLocation.known ? {center: userLocation, zoom: 9} : {zoom: 1}
  // if the user hasn't selected a location, we just show all users who have a map location (ordered by karma desc)
  const searchOptions = userLocation.known ? {aroundLatLng: `${userLocation?.lat}, ${userLocation.lng}`} : {filters: "_geoloc.lat>-100"}
  
  return <InstantSearch
    indexName={'test_users'}
    searchClient={getSearchClient()}
  >
    <div className={classes.filters}>
      <CustomSearchBox />
      {locationFilterNode}
    </div>
    <div className={classes.people}>
      <div className={classes.peopleList}>
        <CustomStateResults />
        <Hits hitComponent={CommunityMember} />
        <Pagination className={classes.pagination} />
      </div>
      <div className={classes.map}>
        {/* search result hits are provided by InstantSearch, which is probably a provider */}
        <SearchResultsMap {...mapOptions} />
      </div>
    </div>
    <Configure hitsPerPage={100} {...searchOptions} />
  </InstantSearch>
}

const CommunityMembersComponent = registerComponent('CommunityMembers', CommunityMembers, {styles});

declare global {
  interface ComponentTypes {
    CommunityMembers: typeof CommunityMembersComponent
  }
}

