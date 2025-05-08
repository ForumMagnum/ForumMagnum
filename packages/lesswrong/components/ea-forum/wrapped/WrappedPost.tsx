import React, { useRef } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { InteractionWrapper, useClickableCell } from "@/components/common/useClickableCell";
import { Link } from "@/lib/reactRouterWrapper";
import { isPostWithForeignId } from "@/components/hooks/useForeignCrosspost";
import { SoftUpArrowIcon } from "@/components/icons/softUpArrowIcon";
import type { WrappedTopPost } from "./hooks";
import { PostsItemTooltipWrapper } from "../../posts/PostsItemTooltipWrapper";
import { TruncatedAuthorsList } from "../../posts/TruncatedAuthorsList";
import { PostMostValuableCheckbox } from "../../posts/PostMostValuableCheckbox";
import { BookmarkButton } from "../../posts/BookmarkButton";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    minHeight: 50,
    background: theme.palette.wrapped.panelBackground,
    color: theme.palette.text.alwaysWhite,
    fontSize: 14,
    lineHeight: "normal",
    fontWeight: 600,
    textAlign: "left",
    borderRadius: theme.borderRadius.default,
    padding: "8px 12px",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.9,
    },
  },
  score: {
    flex: "none",
    width: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: theme.palette.wrapped.postScore,
  },
  voteArrow: {
    color: theme.palette.wrapped.postScore,
    margin: "-6px 0 2px 0",
  },
  titleAndMeta: {
    flexGrow: 1,
  },
  titleWrapper: {
    lineHeight: "19px",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  title: {
    "&:hover": {
      opacity: 1,
    },
  },
  metaRow: {
    display: "flex",
  },
  meta: {
    color: theme.palette.wrapped.postScore,
    fontSize: 12,
    fontWeight: 500,
    marginTop: 2,
  },
  bookmarkIcon: {
    fontSize: 18,
    color: theme.palette.wrapped.postScore,
  },
});

const WrappedPostInner = ({post, showMostValuableCheckbox, classes}: {
  post: WrappedTopPost | PostsListWithVotes,
  showMostValuableCheckbox?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const authorExpandContainer = useRef(null);
  const postLink = postGetPageUrl(post)
  const {onClick} = useClickableCell({href: postLink});

  // If this is the user's own post, we use the simple version of this component
  // with less info. If this is a post recommended to the user, we show things
  // like the post author list.
  const isRecommendedPost = "user" in post;

  const titleNode = (
    <InteractionWrapper>
      <Link to={postLink} className={classes.title} target="_blank">{post.title}</Link>
    </InteractionWrapper>
  );

  const readTimeText = (!isRecommendedPost || isPostWithForeignId(post))
    ? ""
    : `, ${post.readTimeMinutes ?? 1} min read`;
  return (
    <article className={classes.root} ref={authorExpandContainer} onClick={onClick}>
      <div className={classes.score}>
        <div className={classes.voteArrow}>
          <SoftUpArrowIcon />
        </div>
        {post.baseScore}
      </div>
      <div className={classes.titleAndMeta}>
        <div className={classes.titleWrapper}>
          {isRecommendedPost
            ? (
              <PostsItemTooltipWrapper post={post}>
                {titleNode}
              </PostsItemTooltipWrapper>
            )
            : titleNode
          }
        </div>
        {isRecommendedPost &&
          <div className={classes.metaRow}>
            <InteractionWrapper>
              <TruncatedAuthorsList
                post={post}
                expandContainer={authorExpandContainer}
                className={classes.meta}
              />
            </InteractionWrapper>
            <span className={classes.meta}>
              {readTimeText}
            </span>
          </div>
        }
      </div>
      {isRecommendedPost && !showMostValuableCheckbox &&
        <InteractionWrapper>
          <BookmarkButton documentId={post._id} collectionName="Posts" className={classes.bookmarkIcon} />
        </InteractionWrapper>
      }
      {showMostValuableCheckbox &&
        <InteractionWrapper>
          <PostMostValuableCheckbox post={post} />
        </InteractionWrapper>
      }
    </article>
  );
}

export const WrappedPost = registerComponent(
  "WrappedPost",
  WrappedPostInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedPost: typeof WrappedPost
  }
}
