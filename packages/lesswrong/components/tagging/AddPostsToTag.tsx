import React, { useCallback, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { useTracking } from "../../lib/analyticsEvents";
import SearchIcon from '@material-ui/icons/Search';
import AddBoxIcon from '@material-ui/icons/AddBox';
import classNames from 'classnames';
import { useMessages } from '../common/withMessages';
import { handleUpdateMutation, updateEachQueryResultOfType } from '../../lib/crud/cacheUpdates';
import { InstantSearch, SearchBox, Index, Configure, Hits } from 'react-instantsearch-dom';
import { algoliaIndexNames, getSearchClient } from '../../lib/algoliaUtil';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    transition: ".25s",
    display: "flex",
    '& input': {
      width: 70,
      cursor: "pointer"
    }
  },
  open: {
    '& input': {
      width: 260,
      cursor: "unset"
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    }
  },
  icon: {
    height: 18,
    marginTop: 2,
    marginRight: 3,
    color: theme.palette.grey[500]
  },
  searchBar: {

  },
  search: {
    
  }
});



const AddPostsToTag = ({classes, tag}: {
  classes: ClassesType,
  tag: TagPreviewFragment
}) => {
  const [isAwaiting, setIsAwaiting] = useState(false);
  const { captureEvent } = useTracking()
  const { flash } = useMessages()
  const [ searchOpen, setSearchOpen ] = useState(false)  
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const [mutate] = useMutation(gql`
    mutation addOrUpvoteTag($tagId: String, $postId: String) {
      addOrUpvoteTag(tagId: $tagId, postId: $postId) {
        ...TagRelCreationFragment
      }
    }
    ${getFragment("TagRelCreationFragment")}
  `, {
    update(cache, { data: {addOrUpvoteTag: TagRel}  }) {
      updateEachQueryResultOfType({ func: handleUpdateMutation, store: cache, typeName: "Post",  document: TagRel.post })
    }
  });

  const onPostSelected = useCallback(async (event, postId) => {
    event.preventDefault();
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
      return
    }
    setIsAwaiting(true)
    await mutate({
      variables: {
        tagId: tag._id,
        postId: postId,
      },
    });    
    setIsAwaiting(false)
    flash({messageString: `Tagged post with '${tag.name} (Refresh Page)'`, type: "success"})
    captureEvent("tagAddedToItem", {tagId: tag._id, tagName: tag.name})
  }, [mutate, flash, tag._id, tag.name, captureEvent]);

  const { SearchPagination, PostsSearchHit, Loading } = Components
  return <div className={classNames(classes.root, {[classes.open]: searchOpen})} onClick={() => setSearchOpen(true)}>
    {searchOpen && <SearchIcon className={classes.icon}/>}
    {!searchOpen && !isAwaiting && <AddBoxIcon className={classes.icon}/>}
    {searchOpen && <div className={classes.search}>
      <InstantSearch
        indexName={algoliaIndexNames.Posts}
        searchClient={getSearchClient()}
      > 
        <div className={classes.searchBar}>
          <SearchBox focusShortcuts={[]} autoFocus={true} />
          <SearchPagination />
        </div>
        <Configure hitsPerPage={6} />
        <Hits hitComponent={(props) => <PostsSearchHit {...props} clickAction={onPostSelected} />} />
      </InstantSearch>
    </div>}
  </div>
}

const AddPostsToTagComponent = registerComponent("AddPostsToTag", AddPostsToTag, {styles})

declare global {
  interface ComponentTypes {
    AddPostsToTag: typeof AddPostsToTagComponent
  }
}

