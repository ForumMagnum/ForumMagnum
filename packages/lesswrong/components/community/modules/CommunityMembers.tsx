import { Components, registerComponent, } from '../../../lib/vulcan-lib';
import React, { ReactNode, useRef } from 'react';
import { createStyles } from '@material-ui/core/styles';
import { Link } from '../../../lib/reactRouterWrapper';
import { getSearchClient } from '../../../lib/algoliaUtil';
import { Configure, connectSearchBox, connectStateResults, Hits, InstantSearch, Pagination } from 'react-instantsearch-dom';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Search from '@material-ui/icons/Search';
import Button from '@material-ui/core/Button';
import { distance } from './LocalGroups';
import { useTracking } from '../../../lib/analyticsEvents';
import { truncate } from '../../../lib/editor/ellipsize';
import { isEAForum } from '../../../lib/instanceSettings';
import type { BasicDoc, SearchBoxProvided, StateResultsProvided } from 'react-instantsearch-core';

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
  locationFilter: {
    flexGrow: 1
  },
  fullMapLink: {
    color: theme.palette.primary.main,
    ...theme.typography.commentStyle,
    fontSize: isEAForum ? 14 : 13,
    margin: '0 5px'
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
      marginLeft: -8,
      marginRight: -8,
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
    background: theme.palette.panelBackground.default,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: theme.palette.greyAlpha(.1),
  },
  content: {
    padding: 20,
    [theme.breakpoints.down('xs')]: {
      paddingBottom: 30
    },
  },
  photoRow: {
    display: 'flex',
    columnGap: 10,
    alignItems: 'center',
  },
  profileImage: {
    'box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    '-webkit-box-shadow': '0px 0px 2px 0px ' + theme.palette.boxShadowColor(.25),
    '-moz-box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    borderRadius: '50%',
  },
  photoRowText: {
    flex: '1 1 0'
  },
  nameRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  displayName: {
    ...theme.typography.headerStyle,
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
    marginTop: 4,
  },
  description: {
    color: theme.palette.grey[800],
    marginTop: 12,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'right',
    marginTop: 14
  },
  messageBtn: {
    boxShadow: 'none'
  },
  mapContainer: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  },
  map: {
    height: 440,
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


const CommunityMembers = ({currentUser, userLocation, distanceUnit='km', locationFilterNode, classes}: {
  currentUser: UsersCurrent | null,
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
  const { captureEvent } = useTracking()
  const keywordSearchTimer = useRef<any>(null)

  const { NewConversationButton, SearchResultsMap, ContentStyles } = Components
  
  const SearchBox: React.FunctionComponent<SearchBoxProvided> = ({currentRefinement, refine}) => {
    return <div className={classes.keywordSearch}>
      <OutlinedInput
        labelWidth={0}
        startAdornment={<Search className={classes.searchIcon}/>}
        placeholder="Search people"
        value={currentRefinement}
        onChange={e => {
          const newKeyword = e.target.value
          refine(newKeyword)
          // log the event after typing has stopped for 1 second
          clearTimeout(keywordSearchTimer.current)
          keywordSearchTimer.current = setTimeout(
            () => captureEvent(`keywordSearchCommunityMembers`, {keyword: newKeyword}),
            1000
          )
        }}
        className={classes.keywordSearchInput}
      />
    </div>
  }
  const CustomSearchBox = connectSearchBox(SearchBox)
  
  const StateResults: React.FunctionComponent<StateResultsProvided<BasicDoc>> = ({ searchResults }) => {
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
        <div className={classes.photoRow}>
          {hit.profileImageId && <Components.CloudinaryImage2
            height={50}
            width={50}
            imgProps={{q: '100'}}
            publicId={hit.profileImageId}
            className={classes.profileImage}
          />}
          <div className={classes.photoRowText}>
            <div className={classes.nameRow}>
              <Link to={`/users/${hit.slug}?from=community_members_tab`} className={classes.displayName}>
                {hit.displayName}
              </Link>
              <div className={classes.distance}>
                {distanceToPerson}
              </div>
            </div>
            <div className={classes.location}>{hit.mapLocationAddress}</div>
          </div>
        </div>
        {hit.htmlBio && <ContentStyles contentType="comment" className={classes.description}>
          <div dangerouslySetInnerHTML={{__html: truncate(hit.htmlBio, 220)}} />
        </ContentStyles>}
        {hit._id !== currentUser?._id && <div className={classes.buttonRow}>
          <NewConversationButton user={hit} currentUser={currentUser} from="community_members_tab">
            <Button variant="contained" color="primary" className={classes.messageBtn}>Message</Button>
          </NewConversationButton>
        </div>}
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
      <div className={classes.locationFilter}>{locationFilterNode}</div>
      <Link to="/community/map" className={classes.fullMapLink}>View full map</Link>
    </div>
    <div className={classes.people}>
      <div className={classes.peopleList}>
        <CustomStateResults />
        <Hits hitComponent={CommunityMember} />
        <Pagination className={classes.pagination} />
      </div>
      <div className={classes.mapContainer}>
        {/* search result hits are provided by InstantSearch, which is probably a provider */}
        <SearchResultsMap {...mapOptions} className={classes.map} />
      </div>
    </div>
    <Configure hitsPerPage={200} aroundRadius="all" {...searchOptions} />
  </InstantSearch>
}

const CommunityMembersComponent = registerComponent('CommunityMembers', CommunityMembers, {styles});

declare global {
  interface ComponentTypes {
    CommunityMembers: typeof CommunityMembersComponent
  }
}

