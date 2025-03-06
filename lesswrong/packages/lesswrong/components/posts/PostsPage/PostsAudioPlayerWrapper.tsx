import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isPostAllowedType3Audio } from '../../../lib/collections/posts/helpers';
import PostsPodcastPlayer from "@/components/posts/PostsPage/PostsPodcastPlayer";
import T3AudioPlayer from "@/components/posts/PostsPage/T3AudioPlayer";

const styles = (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
});

export const postHasAudioPlayer = (post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes) => {
  return post.podcastEpisode || isPostAllowedType3Audio(post);
}

export const PostsAudioPlayerWrapper = ({post, showEmbeddedPlayer, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  showEmbeddedPlayer: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  return <>
    {post.podcastEpisode && <div className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
      <PostsPodcastPlayer podcastEpisode={post.podcastEpisode} postId={post._id} />
    </div>}
    {isPostAllowedType3Audio(post) && <T3AudioPlayer showEmbeddedPlayer={!!showEmbeddedPlayer} postId={post._id}/>}
  </>;
}

const PostsAudioPlayerWrapperComponent = registerComponent('PostsAudioPlayerWrapper', PostsAudioPlayerWrapper, {styles});

declare global {
  interface ComponentTypes {
    PostsAudioPlayerWrapper: typeof PostsAudioPlayerWrapperComponent
  }
}

export default PostsAudioPlayerWrapperComponent;
