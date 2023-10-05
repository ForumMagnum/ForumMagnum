import React from "react";
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
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    rowGap: "4px",
    overflow: "hidden",
    height: 20,
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
  postsList,
  post,
  hash,
  comment,
  classes,
}: EAPostsPreviewTooltipProps) => {
  if (!post) {
    return null;
  }

  const {imageUrl} = post.socialPreviewData ?? {};

  const {PostExcerpt, FooterTag} = Components;
  return (
    <AnalyticsContext pageElementContext={POST_PREVIEW_ELEMENT_CONTEXT}>
      <div className={classes.root}>
        <div className={classes.mainContainer}>
          <div className={classes.headerContainer}>
            <div className={classes.title}>
              {post.title}
            </div>
            {post.tags &&
              <div className={classes.tags}>
                {post.tags.slice(0, 4).map((tag) => (
                  <FooterTag key={tag._id} tag={tag} smallText />
                ))}
              </div>
            }
          </div>
          <PostExcerpt post={post} lines={7} hideMoreLink />
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
