import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';

const DialoguesList = ({limit=20, hideLoadMore=false}: {
  limit?: number,
  hideLoadMore?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { PostsItem, LoadMore } = Components

  const {
    results: dialoguePosts
  } = usePaginatedResolver({
    fragmentName: "PostsPage",
    resolverName: "RecentlyActiveDialogues",
    limit: 3,
  }); 

  return <AnalyticsContext pageSubSectionContext="dialoguesList">
    <div>
      {dialoguePosts && dialoguePosts.map((post: PostsListWithVotes, i: number) =>
        <PostsItem
          key={post._id} post={post}
          showBottomBorder={i < dialoguePosts.length-1}
        />
      )}
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
