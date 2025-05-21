import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { ReactNode, useRef } from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { getSearchClient } from '../../../lib/search/searchUtil';
import { Configure, connectSearchBox, connectStateResults, Hits, Pagination } from 'react-instantsearch-dom';
import OutlinedInput from '@/lib/vendor/@material-ui/core/src/OutlinedInput';
import { distance } from './LocalGroups';
import { useTracking } from '../../../lib/analyticsEvents';
import type { BasicDoc, SearchBoxProvided, StateResultsProvided } from 'react-instantsearch-core';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { InstantSearch } from '../../../lib/utils/componentsWithChildren';
import CloudinaryImage2 from "../../common/CloudinaryImage2";
import SearchResultsMap from "./SearchResultsMap";
import ContentStyles from "../../common/ContentStyles";
import ForumIcon from "../../common/ForumIcon";

const styles = (theme: ThemeType) => ({
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
    [theme.breakpoints.down('xs')]: {
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
    fontSize: isFriendlyUI ? 14 : 13,
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
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '1fr',
      marginLeft: -8,
      marginRight: -8,
    }
  },
  peopleList: {
    height: 440,
    overflowY: 'scroll',
    [theme.breakpoints.down('xs')]: {
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
    columnGap: 14,
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
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 12,
    [theme.breakpoints.down('xs')]: {
      "-webkit-line-clamp": 4,
    }
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
    [theme.breakpoints.down('xs')]: {
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
});

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
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking()
  const keywordSearchTimer = useRef<any>(null)
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const SearchBox: React.FunctionComponent<SearchBoxProvided> = ({currentRefinement, refine}) => {
    return <div className={classes.keywordSearch}>
      <OutlinedInput
        labelWidth={0}
        startAdornment={<ForumIcon icon="Search" className={classes.searchIcon}/>}
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
  
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const StateResults: React.FunctionComponent<StateResultsProvided<BasicDoc>> = ({ searchResults }) => {
    return (!searchResults || !searchResults.nbHits) ? <div className={classes.noResults}>
      <div className={classes.noResultsText}>No public profiles matching your search</div>
    </div> : null
  }
  const CustomStateResults = connectStateResults(StateResults)
  
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const CommunityMember = ({hit}: {
    hit: SearchUser,
  }) => {
    // the distance from the user's location to the person's location
    let distanceToPerson;
    if (userLocation.known && hit._geoloc) {
      const location = {
        lng: hit._geoloc.coordinates[0],
        lat: hit._geoloc.coordinates[1],
      };
      distanceToPerson = `${distance(userLocation, location, distanceUnit)} ${distanceUnit}`
    }
    
    return <div className={classes.person}>
      <div className={classes.content}>
        <div className={classes.photoRow}>
          {hit.profileImageId && <CloudinaryImage2
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
        {hit.bio && <ContentStyles contentType="comment" className={classes.description}>
          {hit.bio}
        </ContentStyles>}
        {/* {hit._id !== currentUser?._id && <div className={classes.buttonRow}>
          <NewConversationButton user={hit} currentUser={currentUser} from="community_members_tab">
            <Button variant="contained" color="primary" className={classes.messageBtn}>Message</Button>
          </NewConversationButton>
        </div>} */}
      </div>
    </div>
  }
  
  // if the user hasn't selected a location, we show the whole map
  const mapOptions = userLocation.known ? {center: userLocation, zoom: 9} : {zoom: 1}
  // if the user hasn't selected a location, we just show all users who have a map location (ordered by a mix of "relevance" and karma desc)
  const searchOptions = userLocation.known ? {aroundLatLng: `${userLocation?.lat}, ${userLocation.lng}`} : {}
  
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
    <Configure hitsPerPage={200} aroundRadius="all" existsFilters={['_geoloc']} {...searchOptions} />
  </InstantSearch>
}

export default registerComponent('CommunityMembers', CommunityMembers, {styles});



