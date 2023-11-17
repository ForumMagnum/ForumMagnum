import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const SequencesPostsList = ({posts, chapter}: {
  posts: Array<PostsListWithVotes>,
  chapter?: ChaptersFragment,
}) => {
  return <div>
    {posts.map((post) => <Components.PostsItem key={post._id} post={post} chapter={chapter} />)}
  </div>
}

const SequencesPostsListComponent = registerComponent('SequencesPostsList', SequencesPostsList)

declare global {
  interface ComponentTypes {
    SequencesPostsList: typeof SequencesPostsListComponent
  }
}
