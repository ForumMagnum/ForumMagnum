import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isLWorAF } from '@/lib/instanceSettings';
import { PostsByVote } from "./PostsByVote";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { Loading } from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import { LWPostsByVote } from "./LWPostsByVote";

const PostsByVoteWrapperInner = ({voteType, year, limit, showMostValuableCheckbox=false, hideEmptyStateText=false, postItemClassName}: {
  voteType: string,
  year: number | '≤2020',
  limit?: number,
  showMostValuableCheckbox?: boolean,
  hideEmptyStateText?: boolean,
  postItemClassName?: string,
}) => {
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

export const PostsByVoteWrapper = registerComponent("PostsByVoteWrapper", PostsByVoteWrapperInner);

declare global {
  interface ComponentTypes {
    PostsByVoteWrapper: typeof PostsByVoteWrapper
  }
}
