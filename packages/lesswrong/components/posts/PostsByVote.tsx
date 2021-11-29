import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const PostsByVote = ({postIds, year}: {postIds: Array<string>, year: number | '≤2020'}) => {
    const { PostsItem2, ErrorBoundary } = Components

    const before = year === '≤2020' ? '2021-01-01' : `${year + 1}-01-01`
    const after = `${year}-01-01`

    const { results: posts } = useMulti({
      terms: {
        view: "nominatablePostsByVote",
        postIds,
        before,
        ...(year === '≤2020' ? {} : {after}),
      },
      collectionName: "Posts",
      fragmentName: "PostsList",
      limit: 1000,
    })
    
    if (!posts || posts.length === 0) return <div>None</div>


    return <ErrorBoundary><div>
          {posts.map(post=> <PostsItem2 key={post._id} post={post} />)}
      </div></ErrorBoundary>
}

const PostsByVoteComponent = registerComponent("PostsByVote", PostsByVote);

declare global {
  interface ComponentTypes {
    PostsByVote: typeof PostsByVoteComponent
  }
}
