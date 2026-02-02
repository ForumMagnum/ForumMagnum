import React, { useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import classNames from "classnames";
import { commentBodyStyles } from "../../themes/stylePiping";
import ForumIcon from "../common/ForumIcon";
import LWPopper from "../common/LWPopper";
import CommentsNode from "../comments/CommentsNode";
import CommentsItemMeta from "../comments/CommentsItem/CommentsItemMeta";
import CommentBottomCaveats from "../comments/CommentsItem/CommentBottomCaveats";
import { Link } from "../../lib/reactRouterWrapper";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles("ReviewQuickTakeItem", (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.small,
    paddingLeft: 12,
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 10,
    marginBottom: 8,
    "&:hover .CommentsItemMeta-menu": {
      opacity: 1
    },
    ...theme.typography.commentStyle,
  },
  postTitle: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    marginBottom: 4,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commentCount: {
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    gap: 2,
    "& svg": {
      height: 16,
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  commentCountClickable: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  bodyWrapper: {
    cursor: "pointer",
  },
  body: {
    ...commentBodyStyles(theme),
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  hoverOver: {
    width: 400,
    background: theme.palette.panelBackground.default,
  },
  commentCountText: {
    fontSize: 13,
    marginTop: -2,
    marginRight: 4
  },
}));

const ReviewQuickTakeItem = ({ review, setExpanded }: {
  review: CommentsListWithParentMetadata,
  setExpanded: (expanded: boolean) => void,
}) => {
  const classes = useStyles(styles);
  const {eventHandlers, hover, anchorEl} = useHover({
    eventProps: {
      pageElementContext: "reviewItemTooltip",
      commentId: review._id,
    },
  });

  const expand = useCallback(() => {
    setExpanded(true);
  }, [setExpanded]);

  const [showParentState, setShowParentState] = useState(false);

  const toggleShowParent = () => {
    setShowParentState(!showParentState);
  }

  const commentCount = review.descendentCount ?? 0;
  const commentsAreClickable = commentCount > 0;
  const displayHoverOver = hover && (review.baseScore ?? 0) > -5 && !isMobile();

  const commentsUrl = review.post
    ? `${postGetPageUrl(review.post)}#${review._id}`
    : undefined;

  const setShowEdit = useCallback(() => {
    if (commentsUrl) {
      window.location.href = commentsUrl;
    }
  }, [commentsUrl]);

  const onClickComments = useCallback(() => {
    if (commentsAreClickable) {
      expand();
      setTimeout(() => {
        const {_id} = review;
        const children = document.querySelector(`#${_id} .comments-children`);
        children?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 0);
    }
  }, [expand, commentsAreClickable, review]);

  const commentCountIcon = (
    <div
      onClick={onClickComments}
      className={classNames(classes.commentCount, {
        [classes.commentCountClickable]: commentsAreClickable,
      })}
    >
      <ForumIcon icon="Comment" />
      <span className={classes.commentCountText}>
        {commentCount}
      </span>
    </div>
  );

  const tooltip = (
    <LWPopper
      open={displayHoverOver}
      anchorEl={anchorEl}
      placement="bottom-end"
      clickable={false}
    >
      <div className={classes.hoverOver}>
        <CommentsNode
          truncated
          nestingLevel={1}
          comment={review}
          treeOptions={{
            post: review.post || undefined,
            showCollapseButtons: true,
            hideReply: true,
            forceSingleLine: false,
            forceNotSingleLine: true,
          }}
          hoverPreview />
      </div>
    </LWPopper>
  );

  const postTitle = review.post && (
    <Link to={postGetPageUrl(review.post)} className={classes.postTitle}>
      {review.post.title}
    </Link>
  );

  const body = (
    <div className={classes.bodyWrapper} onClick={expand} {...eventHandlers}>
      <div className={classes.body}>
        {review.contents?.plaintextMainText}
      </div>
    </div>
  );

  return (
    <div className={classes.root}>
      {postTitle}
      <CommentsItemMeta
        {...{
          treeOptions: {
            post: review.post ?? undefined,
            hideParentCommentToggle: true,
            showCollapseButtons: false,
            onToggleCollapsed: () => setExpanded(true),
            showPostTitle: false,
          },
          comment: review,
          showCommentTitle: false,
          showParentState,
          toggleShowParent,
          collapsed: false,
          toggleCollapse: () => setExpanded(true),
          setShowEdit,
          rightSectionElements: commentCountIcon
        }}
      />
      {body}
      <CommentBottomCaveats comment={review} />
      {tooltip}
    </div>
  );
}

export default registerComponent(
  "ReviewQuickTakeItem",
  ReviewQuickTakeItem,
);
