import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { getSearchClient } from '../../../lib/search/searchUtil';
import { Configure } from 'react-instantsearch-dom';
import { InstantSearch } from "../../../lib/utils/componentsWithChildren";

const styles = (theme: ThemeType) => ({
  map: {
    height: '100vh',
    marginTop: -theme.spacing.mainLayoutPaddingTop,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
    },
  }
});

const CommunityMembersFullMapInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { SearchResultsMap } = Components
  
  return <InstantSearch
    indexName={'test_users'}
    searchClient={getSearchClient()}
  >
    <SearchResultsMap zoom={1} className={classes.map} />
    <Configure hitsPerPage={1500} existsFilters={['_geoloc']} />
  </InstantSearch>
}

export const CommunityMembersFullMap = registerComponent('CommunityMembersFullMap', CommunityMembersFullMapInner, {styles});

declare global {
  interface ComponentTypes {
    CommunityMembersFullMap: typeof CommunityMembersFullMap
  }
}

