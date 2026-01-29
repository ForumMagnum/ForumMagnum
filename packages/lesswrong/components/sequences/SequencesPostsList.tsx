import React from 'react';
import PostsItem from "../posts/PostsItem";

const SequencesPostsList = ({posts, chapter}: {
  posts: Array<PostsListWithVotes>,
  chapter?: ChaptersFragment,
}) => {
  return <div>
    {posts.map((post) => <PostsItem key={post._id} post={post} chapter={chapter} />)}
  </div>
}

export default SequencesPostsList;
