import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const PostsByVoteWrapper = ({voteType, year}:{voteType: string, year: number}) => {
    const { PostsByVote, ErrorBoundary } = Components

    const before = `${year + 1}-01-01`
    const after = `${year}-01-01`

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
        <PostsByVote postIds={postIds} year={year}/>
      </ErrorBoundary>
}

const PostsByVoteWrapperComponent = registerComponent("PostsByVoteWrapper", PostsByVoteWrapper);

declare global {
  interface ComponentTypes {
    PostsByVoteWrapper: typeof PostsByVoteWrapperComponent
  }
}

