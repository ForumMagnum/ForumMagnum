import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { PostsItem } from "./PostsItem";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { Loading } from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import { LoadMore } from "../common/LoadMore";

const PostsByVoteInner = ({postIds, year, limit, showMostValuableCheckbox=false, hideEmptyStateText=false, postItemClassName}: {
  postIds: Array<string>,
  year: number | '≤2020',
  limit?: number,
  showMostValuableCheckbox?: boolean,
  hideEmptyStateText?: boolean,
  postItemClassName?: string,
}) => {
  const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
  const after = `${year}-01-01`

  const { results: posts, loading, showLoadMore, loadMoreProps } = useMulti({
    terms: {
      view: "nominatablePostsByVote",
      postIds,
      before,
      ...(year === '≤2020' ? {} : {after}),
    },
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    limit: limit ?? 1000,
  })

  if (loading && !posts) return <div><Loading/> <Typography variant="body2">Loading Posts</Typography></div>

  if (!posts || posts.length === 0) {
    return hideEmptyStateText ? null : <Typography variant="body2">You have no upvotes from this period</Typography>
  }

  return <ErrorBoundary>
    <div>
      {posts.map(post => {
        return <PostsItem
          key={post._id}
          post={post}
          showMostValuableCheckbox={showMostValuableCheckbox}
          hideTag
          className={postItemClassName}
        />
      })}
      {showLoadMore && <LoadMore {...loadMoreProps} />}
    </div>
  </ErrorBoundary>
}

export const PostsByVote = registerComponent("PostsByVote", PostsByVoteInner);


