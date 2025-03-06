import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import PostsItem from "@/components/posts/PostsItem";

const SequencesPostsList = ({posts, chapter}: {
  posts: Array<PostsListWithVotes>,
  chapter?: ChaptersFragment,
}) => {
  return <div>
    {posts.map((post) => <PostsItem key={post._id} post={post} chapter={chapter} />)}
  </div>
}

const SequencesPostsListComponent = registerComponent('SequencesPostsList', SequencesPostsList)

declare global {
  interface ComponentTypes {
    SequencesPostsList: typeof SequencesPostsListComponent
  }
}

export default SequencesPostsListComponent;
