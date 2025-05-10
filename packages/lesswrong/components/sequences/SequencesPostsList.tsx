import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { PostsItem } from "../posts/PostsItem";

const SequencesPostsListInner = ({posts, chapter}: {
  posts: Array<PostsListWithVotes>,
  chapter?: ChaptersFragment,
}) => {
  return <div>
    {posts.map((post) => <PostsItem key={post._id} post={post} chapter={chapter} />)}
  </div>
}

export const SequencesPostsList = registerComponent('SequencesPostsList', SequencesPostsListInner)


