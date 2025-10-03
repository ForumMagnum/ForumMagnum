import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isLWorAF } from '@/lib/instanceSettings';
import PostsByVote from "./PostsByVote";
import ErrorBoundary from "../common/ErrorBoundary";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import LWPostsByVote from "./LWPostsByVote";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const UserVotesMultiQuery = gql(`
  query multiVotePostsByVoteWrapperQuery($selector: VoteSelector, $limit: Int, $enableTotal: Boolean) {
    votes(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UserVotes
      }
      totalCount
    }
  }
`);

const PostsByVoteWrapper = ({voteType, year, limit, showMostValuableCheckbox=false, hideEmptyStateText=false, postItemClassName}: {
  voteType: VoteType,
  year: number | '≤2020',
  limit?: number,
  showMostValuableCheckbox?: boolean,
  hideEmptyStateText?: boolean,
  postItemClassName?: string,
}) => {
  // const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
  const after = `${year}-01-01`

  const { data, loading } = useQuery(UserVotesMultiQuery, {
    variables: {
      selector: { userPostVotes: { collectionName: "Posts", voteType: voteType, ...(year === '≤2020' ? {} : { after }) } },
      limit: 10000,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const votes = data?.votes?.results;

  if (loading) return <div><Loading/><Typography variant="body2">Loading Votes</Typography></div>
    
  const postIds = (votes ?? []).map(vote=>vote.documentId)

  return <ErrorBoundary>
    {isLWorAF() ? <LWPostsByVote
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

export default registerComponent("PostsByVoteWrapper", PostsByVoteWrapper);


