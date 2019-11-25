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
  
  // When this appears, yield to the event loop once, use getElementsByTagName
  // to find the search input text box, then focus it.
  //
  // Why this hideously complicated thing, rather than just set autoFocus={true}
  // on the <SearchBox> component? Unfortunately this component gets used inside
  // Material-UI Poppers, and Poppers have an unfortunate property: they first
  // render off-screen, then measure the size of their contents, then move
  // themselves to their correct position. This means that during first-render,
  // this component is positioned in an off-screen temporary location, and if
  // you focus the input box then, it will scroll the page to the bottom. In
  // order to avoid this, we have to defer focusing until Popper is finished,
  // ie setTimeout(..., 0). Unfortunately again, react-instantsearch's SearchBox
  // component doesn't expose an API for controlling focus other than at mount
  // time, so in order to find the text box we want focused, we have to search
  // the DOM for it.
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (containerRef.current) {
      const input = containerRef.current.getElementsByTagName("input")[0];
      setTimeout(() => {
        input.focus();
      }, 0);
    }
  }, []);
  
  return <div className={classes.root} ref={containerRef}>
    <InstantSearch
      indexName={algoliaIndexNames.Tags}
      appId={algoliaAppId}
      apiKey={algoliaSearchKey}
      onSearchStateChange={searchStateChanged}
    >
      <SearchBox reset={null} focusShortcuts={[]}/>
      
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
