import React, { useRef } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { POST_PREVIEW_ELEMENT_CONTEXT, POST_PREVIEW_WIDTH } from "./helpers";
import type { PostsPreviewTooltipProps } from "./PostsPreviewTooltip";
import PostExcerpt from "../../common/excerpts/PostExcerpt";
import EAPostMeta from "../../ea-forum/EAPostMeta";
import TruncatedTagsList from "../../tagging/TruncatedTagsList";
import CommentsNodeInner from "../../comments/CommentsNode";

const styles = (theme: ThemeType) => ({
  root: {
    width: POST_PREVIEW_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
    overflow: "hidden",
    [theme.breakpoints.down("xs")]: {
      display: "none"
    },
  },
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: 16,
  },
  headerContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: {
    fontSize: "1.3rem",
    fontWeight: 600,
    lineHeight: "130%",
    color: theme.palette.grey.A400,
  },
  meta: {
    fontWeight: 450,
    marginTop: -4,
  },
  excerptContainer: {
    maxHeight: 200,
    overflow: "hidden",
    maskImage: `linear-gradient(to bottom, ${theme.palette.grey[0]} 170px, transparent 100%)`,
    "-webkit-mask-image": `linear-gradient(to bottom, ${theme.palette.grey[0]} 170px, transparent 100%)`,
  },
  image: {
    width: "auto",
    minWidth: "100%",
    height: 130,
    objectFit: "cover",
    marginBottom: -4,
    borderRadius: `0 0 ${theme.borderRadius.default}px ${theme.borderRadius.default}px`,
  },
});

type EAPostsPreviewTooltipProps = PostsPreviewTooltipProps & {
  classes: ClassesType<typeof styles>,
}

const EAPostsPreviewTooltip = ({
  post,
  postsList,
  hash,
  comment,
  classes,
}: EAPostsPreviewTooltipProps) => {
  const tagsRef = useRef(null);

  if (!post) {
    return null;
  }

  const showSubheaderInfo = !postsList;
  const {imageUrl} = post.socialPreviewData ?? {};
  return (
    <AnalyticsContext pageElementContext={POST_PREVIEW_ELEMENT_CONTEXT}>
      <div className={classes.root}>
        <div className={classes.mainContainer}>
          <div className={classes.headerContainer}>
            <div className={classes.title}>
              {post.title}
            </div>
            {showSubheaderInfo &&
              <EAPostMeta
                post={post}
                useEventStyles={post.isEvent}
                className={classes.meta}
              />
            }
            {!showSubheaderInfo && post.tags?.length > 0 &&
              <div ref={tagsRef}>
                <TruncatedTagsList post={post} expandContainer={tagsRef} />
              </div>
            }
          </div>
          {comment
            ? (
              <CommentsNodeInner
                treeOptions={{
                  post,
                  hideReply: true,
                  forceNotSingleLine: true,
                }}
                comment={comment}
                truncated
                hoverPreview
                forceUnCollapsed
              />
            )
            : (
              <div className={classes.excerptContainer}>
                <PostExcerpt
                  post={post}
                  hash={hash}
                  lines={3.5}
                  hideMoreLink
                  smallText
                  hideMultimedia
                />
              </div>
            )
          }
        </div>
        {imageUrl &&
          <img className={classes.image} src={imageUrl} />
        }
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "EAPostsPreviewTooltip",
  EAPostsPreviewTooltip,
  {styles},
);


