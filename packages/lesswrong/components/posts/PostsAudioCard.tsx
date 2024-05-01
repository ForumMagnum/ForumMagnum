import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const PostsAudioCard = ({post}: {post: PostsBestOfList}) => {
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

  const {PostsPodcastPlayer} = Components;
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

const PostsAudioCardComponent = registerComponent(
  "PostsAudioCard",
  PostsAudioCard,
);

declare global {
  interface ComponentTypes {
    PostsAudioCard: typeof PostsAudioCardComponent;
  }
}
