import React from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { InstantSearch, SearchBox, Hits } from 'react-instantsearch-dom';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';
import { withStyles } from '@material-ui/core/styles';
import { useCurrentUser } from '../common/withUser.js';
import { Link } from '../../lib/reactRouterWrapper.js';

const styles = theme => ({
  root: {
    "& .ais-SearchBox": {
      padding: 8,
    },
    '& .ais-SearchBox-submit': {
      position: "absolute",
      right: 11
    }
  },
  newTag: {
    display: "block",
    padding: 8,
    cursor: "pointer",
    color: theme.palette.grey[600],
    ...theme.typography.commentStyle
  }
});

const AddTag = ({post, onTagSelected, classes}) => {
  const currentUser = useCurrentUser();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')
  const searchStateChanged = React.useCallback((searchState) => {
    setSearchOpen(searchState.query?.length > 0);
  }, []);
  
  return <div className={classes.root}>
    <InstantSearch
      indexName={algoliaIndexNames.Tags}
      appId={algoliaAppId}
      apiKey={algoliaSearchKey}
      onSearchStateChange={searchStateChanged}
    >
      <SearchBox reset={null} focusShortcuts={[]} autoFocus={false}/>
      
      {searchOpen && <Hits hitComponent={({hit}) =>
        <Components.TagSearchHit hit={hit}
          onClick={ev => {
            onTagSelected(hit);
            ev.stopPropagation();
          }}
        />
      }/>}
    </InstantSearch>
    {currentUser?.isAdmin &&
      <Link to="/tag/create" className={classes.newTag}>
        New Tag
      </Link>}
  </div>
}

registerComponent("AddTag", AddTag,
  withStyles(styles, { name: "AddTag" }));
