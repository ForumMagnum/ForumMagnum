import { Components, registerComponent } from '../../../lib/vulcan-lib';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';
import { getSearchClient } from '../../../lib/search/algoliaUtil';
import { Configure, InstantSearch } from 'react-instantsearch-dom';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  map: {
    height: '100vh',
    marginTop: -theme.spacing.mainLayoutPaddingTop,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
    },
  }
}))


const CommunityMembersFullMap = ({classes}: {
  classes: ClassesType,
}) => {
  const { SearchResultsMap } = Components
  
  return <InstantSearch
    indexName={'test_users'}
    searchClient={getSearchClient()}
  >
    <SearchResultsMap zoom={1} className={classes.map} />
    <Configure hitsPerPage={1000} filters="_geoloc.lat>-100" />
  </InstantSearch>
}

const CommunityMembersFullMapComponent = registerComponent('CommunityMembersFullMap', CommunityMembersFullMap, {styles});

declare global {
  interface ComponentTypes {
    CommunityMembersFullMap: typeof CommunityMembersFullMapComponent
  }
}

