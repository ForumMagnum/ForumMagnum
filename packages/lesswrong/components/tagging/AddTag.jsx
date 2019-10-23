import React from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { InstantSearch, SearchBox, Hits } from 'react-instantsearch-dom';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';
import { withStyles } from '@material-ui/core/styles';
import { useCurrentUser } from '../common/withUser.js';
import { Link } from '../../lib/reactRouterWrapper.js';

const styles = {
  root: {
    "& .ais-SearchBox": {
      padding: 8,
    },
  },
  newTag: {
    display: "block",
    padding: 8,
    cursor: "pointer",
  },
};

const AddTag = ({post, onTagSelected, classes}) => {
  const currentUser = useCurrentUser();
  const algoliaAppId = getSetting('algolia.appId')
  const algoliaSearchKey = getSetting('algolia.searchKey')
  
  return <div className={classes.root}>
    <InstantSearch
      indexName={algoliaIndexNames.Tags}
      appId={algoliaAppId}
      apiKey={algoliaSearchKey}
    >
      <SearchBox reset={null} focusShortcuts={[]} autoFocus={false}/>
      
      <Hits hitComponent={({hit}) =>
        <Components.TagSearchHit hit={hit}
          onClick={ev => {
            onTagSelected(hit);
            ev.stopPropagation();
          }}
        />
      }/>
    </InstantSearch>
    {currentUser?.isAdmin &&
      <Link to="/tag/create" className={classes.newTag}>
        New Tag
      </Link>}
  </div>
}

registerComponent("AddTag", AddTag,
  withStyles(styles, { name: "AddTag" }));
