import React, { useRef } from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { POST_PREVIEW_ELEMENT_CONTEXT, POST_PREVIEW_WIDTH } from "./helpers";
import type { PostsPreviewTooltipProps } from "./PostsPreviewTooltip";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[120]}`,
    boxShadow: theme.palette.boxShadow.eaCard,
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
  image: {
    width: "auto",
    minWidth: "100%",
    height: 130,
    objectFit: "cover",
    marginBottom: -4,
  },
});

type EAPostsPreviewTooltipProps = PostsPreviewTooltipProps & {
  classes: ClassesType,
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
  const renderedComment = comment || post.bestAnswer;
  const {imageUrl} = post.socialPreviewData ?? {};

  const {PostExcerpt, EAPostMeta, TruncatedTagsList, CommentsNode} = Components;
  return (
    <AnalyticsContext pageElementContext={POST_PREVIEW_ELEMENT_CONTEXT}>
      <div className={classes.root}>
        <div className={classes.mainContainer}>
          <div className={classes.headerContainer}>
            <div className={classes.title}>
              {post.title}
            </div>
            {showSubheaderInfo &&
              <EAPostMeta post={post} useEventStyles={post.isEvent} />
            }
            {!showSubheaderInfo &&
              <div ref={tagsRef} >
                <TruncatedTagsList post={post} expandContainer={tagsRef} />
              </div>
            }
          </div>
          {renderedComment
            ? (
              <CommentsNode
                treeOptions={{
                  post,
                  hideReply: true,
                  forceNotSingleLine: true,
                }}
                comment={renderedComment}
                truncated
                hoverPreview
                forceUnCollapsed
              />
            )
            : (
              <PostExcerpt
                post={post}
                hash={hash}
                lines={3.5}
                hideMoreLink
                smallText
                noLinkStyling
              />
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

const EAPostsPreviewTooltipComponent = registerComponent(
  "EAPostsPreviewTooltip",
  EAPostsPreviewTooltip,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAPostsPreviewTooltip: typeof EAPostsPreviewTooltipComponent
  }
}
