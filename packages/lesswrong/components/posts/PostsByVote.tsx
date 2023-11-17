import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const PostsByVote = ({postIds, year, showMostValuableCheckbox=false}: {
  postIds: Array<string>,
  year: number | '≤2020',
  showMostValuableCheckbox?: boolean,
}) => {
  const { PostsItem, ErrorBoundary, Loading, Typography } = Components

  const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
  const after = `${year}-01-01`

  const { results: posts, loading } = useMulti({
    terms: {
      view: "nominatablePostsByVote",
      postIds,
      before,
      ...(year === '≤2020' ? {} : {after}),
    },
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    limit: 1000,
  })

  if (loading) return <div><Loading/> <Typography variant="body2">Loading Posts</Typography></div>

  if (!posts || posts.length === 0) return <Typography variant="body2">You have no upvotes from this period</Typography>

  return <ErrorBoundary>
    <div>
      {posts.map(post => {
        return <PostsItem key={post._id} post={post} showMostValuableCheckbox={showMostValuableCheckbox} />
      })}
    </div>
  </ErrorBoundary>
}

const PostsByVoteComponent = registerComponent("PostsByVote", PostsByVote);

declare global {
  interface ComponentTypes {
    PostsByVote: typeof PostsByVoteComponent
  }
}
