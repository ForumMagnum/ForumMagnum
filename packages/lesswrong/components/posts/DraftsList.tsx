import { registerComponent, Components } from '../../lib/vulcan-lib';
import React, { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import {useMulti} from "../../lib/crud/withMulti";
import { useUpdate } from '../../lib/crud/withUpdate';
// import { postCanDelete } from '../../lib/collections/posts/helpers';

const DraftsList = ({showArchived=false, limit=50}: {
  showArchived?: boolean,
  limit?: number
}) => {
  const currentUser = useCurrentUser();
  const { PostsItem2, Loading } = Components
  
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  const toggleDelete = useCallback((post) => {
    // if (post.deletedDraft||confirm("Are you sure you want to delete this post?")) { //don't confirm to undelete
    void updatePost({
      selector: {_id: post._id},
      data: {deletedDraft:!post.deletedDraft, draft: true} //undeleting goes to draft
    })
    // }
  }, [updatePost])
  
  const { results, loading, error, loadMore, loadMoreProps } = useMulti({
    terms: {
      view: "all_drafts", 
      userId: currentUser?._id,
      limit, 
      sortDrafts: currentUser?.sortDrafts || "modifiedAt" 
    },
    collectionName: "Posts",
    fragmentName: 'PostsList',
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
  });
  
  if (!currentUser) return null
  if (!results && loading) return <Loading />
  
  return <div>
    {results
      .filter((post: PostsList)=>{ return showArchived || !post.deletedDraft})
      .map((post: PostsList, i: number) =>
      <PostsItem2
        key={post._id} 
        post={post}
        draft
        toggleDeleteDraft={toggleDelete}
        hideAuthor
        showDraftTag={false}
        showPersonalIcon={false}
        showBottomBorder={i < results.length-1}
        strikethroughTitle={post.deletedDraft}
      />
    )}
  </div>
}

const DraftsListComponent = registerComponent('DraftsList', DraftsList, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    DraftsList: typeof DraftsListComponent
  }
}


//TODO: A spinner or something while posts are being deleted?
