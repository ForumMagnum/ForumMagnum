import React, { useMemo, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import PostsItemTooltipWrapper from "@/components/posts/PostsItemTooltipWrapper";
import PostsTitle from "@/components/posts/PostsTitle";
import TruncatedAuthorsList from "@/components/posts/TruncatedAuthorsList";
import PostsItemDate from "@/components/posts/PostsItemDate";
import EAKarmaDisplay from "@/components/common/EAKarmaDisplay";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    padding: 12,
    color: theme.palette.text.slightlyIntense2,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
  },
  header: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  karma: {
    marginLeft: 4,
    marginBottom: 10,
  },
  postTitle: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  metadata: {
    marginTop: 4,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  frame: {
    border: "none",
    width: "100%",
    height: 183,
  },
});

const PostsVideoCard = ({post, classes}: {
  post: PostsBestOfList,
  classes: ClassesType<typeof styles>,
}) => {
  const authorExpandContainer = useRef(null);
  const {eventHandlers} = useHover({
    eventProps: {
      pageElementContext: "videoCard",
      documentId: post._id,
      documentSlug: post.slug,
    },
  });

  const embedAttribs  = post.firstVideoAttribsForPreview;
  if (!embedAttribs) {
    return null;
  }
  return (
    <AnalyticsContext documentSlug={post.slug}>
      <div {...eventHandlers} className={classes.root}>
        <div className={classes.header}>
          <EAKarmaDisplay post={post} className={classes.karma} />
          <div>
            <PostsItemTooltipWrapper post={post}>
              <PostsTitle post={post} wrap className={classes.postTitle} />
            </PostsItemTooltipWrapper>
            <div className={classes.metadata} ref={authorExpandContainer}>
              <TruncatedAuthorsList
                post={post}
                expandContainer={authorExpandContainer}
              />
              <span>·</span>
              <PostsItemDate post={post} noStyles includeAgo />
            </div>
          </div>
        </div>
        <iframe {...embedAttribs} className={classes.frame} />
      </div>
    </AnalyticsContext>
  );
}

const PostsVideoCardComponent = registerComponent(
  "PostsVideoCard",
  PostsVideoCard,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsVideoCard: typeof PostsVideoCardComponent;
  }
}

export default PostsVideoCardComponent;
