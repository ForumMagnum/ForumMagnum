import React from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { InstantSearch, SearchBox, Hits } from 'react-instantsearch-dom';
import { algoliaIndexNames } from '../../lib/algoliaIndexNames.js';
import { withStyles } from '@material-ui/core/styles';
import { useCurrentUser } from '../common/withUser.js';

const styles = {
  root: {
    "& .ais-SearchBox": {
      padding: 8,
    },
  },
  newTag: {
    padding: 8,
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
      <div className={classes.newTag}>
        New Tag
      </div>}
  </div>
}

registerComponent("AddTag", AddTag,
  withStyles(styles, { name: "AddTag" }));
