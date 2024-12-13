import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { isLWorAF } from '@/lib/instanceSettings';

const PostsByVoteWrapper = ({voteType, year, limit, showMostValuableCheckbox=false, hideEmptyStateText=false, postItemClassName}: {
  voteType: string,
  year: number | '≤2020',
  limit?: number,
  showMostValuableCheckbox?: boolean,
  hideEmptyStateText?: boolean,
  postItemClassName?: string,
}) => {
  const { PostsByVote, ErrorBoundary, Loading, Typography, LWPostsByVote } = Components

  // const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
  const after = `${year}-01-01`

  const { results: votes, loading } = useMulti({
    terms: {
      view: "userPostVotes",
      collectionName: "Posts",
      voteType: voteType,
      // before,
      ...(year === '≤2020' ? {} : {after}),
    },
    collectionName: "Votes",
    fragmentName: "UserVotes",
    limit: 10000
  });

  if (loading) return <div><Loading/><Typography variant="body2">Loading Votes</Typography></div>
    
  const postIds = (votes ?? []).map(vote=>vote.documentId)

  return <ErrorBoundary>
    {isLWorAF ? <LWPostsByVote
      postIds={postIds}
      year={year}
      limit={limit}
      showMostValuableCheckbox={showMostValuableCheckbox}
      hideEmptyStateText={hideEmptyStateText}
      postItemClassName={postItemClassName}
    /> : <PostsByVote
      postIds={postIds}
      year={year}
      limit={limit}
      showMostValuableCheckbox={showMostValuableCheckbox}
      hideEmptyStateText={hideEmptyStateText}
      postItemClassName={postItemClassName}
    />}
  </ErrorBoundary>
}

const PostsByVoteWrapperComponent = registerComponent("PostsByVoteWrapper", PostsByVoteWrapper);

declare global {
  interface ComponentTypes {
    PostsByVoteWrapper: typeof PostsByVoteWrapperComponent
  }
}
