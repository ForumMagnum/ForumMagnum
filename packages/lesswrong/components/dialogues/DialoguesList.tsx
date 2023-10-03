import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';

const DialoguesList = ({limit=20, hideLoadMore=false}: {
  limit?: number,
  hideLoadMore?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { PostsItem, LoadMore } = Components

  const {results: dialoguePosts, loadMoreProps} = useMulti({
    collectionName: "Posts",
    terms: {
      view: "suggestedDialogues",
      limit: limit,
    },
    itemsPerPage: 20,
    fragmentName: "PostsListWithVotes",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  });

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <div>
      {dialoguePosts && dialoguePosts.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}
      {!hideLoadMore && <LoadMore {...loadMoreProps}/>}
    </div>
  </AnalyticsContext>
}

const DialoguesListComponent = registerComponent('DialoguesList', DialoguesList, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    DialoguesList: typeof DialoguesListComponent
  }
}
