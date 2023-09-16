import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (_theme: ThemeType) => ({
  root: {
    marginBottom: 16,
  },
});

const PostsAudioCard = ({post, classes}: {
  post: PostsBestOfList,
  classes: ClassesType,
}) => {
  const {eventHandlers} = useHover({
    pageElementContext: "audioCard",
    documentId: post._id,
    documentSlug: post.slug,
  });

  if (!post?.podcastEpisode) {
    return null;
  }

  const {PostsPodcastPlayer} = Components;
  return (
    <AnalyticsContext documentSlug={post?.slug ?? "unknown-slug"}>
      <div {...eventHandlers} className={classes.root}>
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
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsAudioCard: typeof PostsAudioCardComponent;
  }
}
