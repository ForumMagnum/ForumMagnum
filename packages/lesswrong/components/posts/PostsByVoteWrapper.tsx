import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { REVIEW_YEAR } from './UserSuggestNominations';

const PostsByVoteWrapper = ({voteType, currentUser}:{voteType: string, currentUser: UsersCurrent}) => {
    const { PostsByVote, ErrorBoundary } = Components

    const before = `${REVIEW_YEAR + 1}-01-01`
    const after = `${REVIEW_YEAR}-01-01`

    const { results: votes } = useMulti({
        terms: {
          view: "userPostVotes",
          collectionName: "Posts",
          voteType: voteType,
          before: before,
          after: after
        },
        collectionName: "Votes",
        fragmentName: "UserVotes",
        limit: 1000
      });
      
    const postIds = votes?.length ? votes.map(vote=>vote.documentId) : []

    return <ErrorBoundary>
        <PostsByVote postIds={postIds}/>
      </ErrorBoundary>
}

const PostsByVoteWrapperComponent = registerComponent("PostsByVoteWrapper", PostsByVoteWrapper);

declare global {
  interface ComponentTypes {
    PostsByVoteWrapper: typeof PostsByVoteWrapperComponent
  }
}

