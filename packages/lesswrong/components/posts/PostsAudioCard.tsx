import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { PostsPodcastPlayer } from "./PostsPage/PostsPodcastPlayer";

const PostsAudioCardInner = ({post}: {post: PostsBestOfList}) => {
  const {eventHandlers} = useHover({
    eventProps: {
      pageElementContext: "audioCard",
      documentId: post._id,
      documentSlug: post.slug,
    },
  });

  if (!post.podcastEpisode) {
    return null;
  }
  return (
    <AnalyticsContext documentSlug={post.slug}>
      <div {...eventHandlers}>
        <PostsPodcastPlayer
          podcastEpisode={post.podcastEpisode}
          postId={post._id}
          hideIconList
        />
      </div>
    </AnalyticsContext>
  );
}

export const PostsAudioCard = registerComponent(
  "PostsAudioCard",
  PostsAudioCardInner,
);


