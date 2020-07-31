import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { InstantSearch, SearchBox, Hits, Configure } from 'react-instantsearch-dom';
import { algoliaIndexNames, isAlgoliaEnabled, getSearchClient } from '../../lib/algoliaUtil';
import { Link } from '../../lib/reactRouterWrapper';
import Divider from '@material-ui/core/Divider';
import { useCurrentUser } from '../common/withUser';
import { userCanCreateTags } from '../../lib/betas';

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

const AddTag = ({onTagSelected, classes}: {
  onTagSelected: (props: {tagId: string, tagName: string})=>void,
  classes: ClassesType,
}) => {
  const { TagSearchHit } = Components
  const currentUser = useCurrentUser()
  const [searchOpen, setSearchOpen] = React.useState(false);
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
  const containerRef = React.useRef<any>(null);
  React.useEffect(() => {
    if (containerRef.current) {
      const input = containerRef.current.getElementsByTagName("input")[0];
      setTimeout(() => {
        input.focus();
      }, 0);
    }
  }, []);
  
  if (!isAlgoliaEnabled) {
    return <div className={classes.root} ref={containerRef}>
      <input placeholder="Tag ID" type="text" onKeyPress={ev => {
        if (ev.charCode===13) {
          const id = (ev.target as any).value;
          onTagSelected({tagId: id, tagName: "Tag"});
          ev.preventDefault();
        }
      }}/>
    </div>
  }
  
  return <div className={classes.root} ref={containerRef}>
    <InstantSearch
      indexName={algoliaIndexNames.Tags}
      searchClient={getSearchClient()}
      onSearchStateChange={searchStateChanged}
    >
      {/* Ignored because SearchBox is incorrectly annotated as not taking null for its reset prop, when
        * null is the only option that actually suppresses the extra X button.
       // @ts-ignore */}
      <SearchBox reset={null} focusShortcuts={[]}/>
      <Configure hitsPerPage={searchOpen ? 12 : 6} />
      <Hits hitComponent={({hit}) =>
        <TagSearchHit hit={hit}
            onClick={ev => {
              onTagSelected({tagId: hit._id, tagName: hit.name});
              ev.stopPropagation();
            }}
          />
        }/>
    </InstantSearch>
    <Divider/>
    <Link to="/tags/all" className={classes.newTag}>
      View All Tags
    </Link>
    {userCanCreateTags(currentUser) && <Link to="/tag/create" className={classes.newTag}>
      Create Tag
    </Link>}
  </div>
}

const AddTagComponent = registerComponent("AddTag", AddTag, {styles});

declare global {
  interface ComponentTypes {
    AddTag: typeof AddTagComponent
  }
}
