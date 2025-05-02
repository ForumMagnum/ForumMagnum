import React, { useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import { ExpandedDate } from "../common/FormatDate";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import withErrorBoundary from "../common/withErrorBoundary";
import moment from "moment";
import { useTracking } from "../../lib/analyticsEvents";
import { Link } from "@/lib/reactRouterWrapper";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import CommentsNode from "./CommentsNode";
import UsersNameDisplay from "../users/UsersNameDisplay";
import UsersName from "../users/UsersName";
import LWTooltip from "../common/LWTooltip";
import LWPopper from "../common/LWPopper";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: SECTION_WIDTH,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: "8px 12px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.grey[600],
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.grey[50],
      border: `1px solid ${theme.palette.grey[250]}`,
    },
  },
  contextRow: {

  },
  contentRow: {
    display: "flex"
  },
  expandedRoot: {
    "& .comments-node-root": {
      marginBottom: 8,
    },
  },
  author: {
    whiteSpace: "nowrap",
    marginLeft: 2,
    color: theme.palette.grey[1000],
    fontWeight: 600,
    lintHeight: "17px",
  },
  date: {
    marginLeft: 10,
  },
  preview: {
    marginLeft: 6,
    whiteSpace: "nowrap",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    color: theme.palette.grey[1000],
  },
  hoverOver: {
    width: 400,
  },
});

const CommentsDraftListItem = ({comment, classes}: {
  comment: DraftComments,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking();

  const [expanded, setExpanded] = useState(false)
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "commentsDraftListItemExpanded" : "commentsDraftListItemCollapsed");
  }, [captureEvent, setExpanded]);

  const {eventHandlers, hover, anchorEl} = useHover({
    eventProps: {
      pageElementContext: "commentsDraftListItemTooltip",
      commentId: comment._id,
    },
  });

  const treeOptions = {
    post: comment.post || undefined,
    showCollapseButtons: true,
    onToggleCollapsed: () => wrappedSetExpanded(!expanded),
  };

  // TODO support quick takes
  const action: "Comment" | "Reply to" = comment.parentCommentId ? "Reply to" : "Comment";
  const parentAuthor = comment.parentComment?.user;
  const post = comment.post; // TODO handle null

  if (expanded) {
    // TODO change a lot
    return (
      <div className={classes.expandedRoot}>
        <CommentsNode
          treeOptions={treeOptions}
          comment={comment}
          loadChildrenSeparately
        />
      </div>
    );
  }

  const displayHoverOver = hover && !isMobile();

  return (
    <div
      className={classes.root}
      onClick={() => wrappedSetExpanded(true)}
      {...eventHandlers}
    >
      <div className={classes.contextRow}>
        {action}{" "}{parentAuthor && <UsersNameDisplay user={parentAuthor} />}{" "}on{" "}
        <Link
          to={postGetPageUrl(post)}
          className={classes.primaryText}
        >
          {post.title}
        </Link>
        {/* Comment{" "}{action}{" "}
        {post &&
          <Link
            to={postUrlOverride ?? postGetPageUrl(post)}
            className={classes.primaryText}
            eventProps={postUrlOverride ? undefined : {intent: 'expandPost'}}
          >
            {postTitleOverride ?? post.title}
          </Link>
        }
        {" "}
        <FormatDate date={timestamp} includeAgo /> */}
      </div>
      <div className={classes.contentRow}>
        <div className={classes.author}>
          <UsersName user={comment.user} />
        </div>
        <div className={classes.date}>
          <LWTooltip
            placement="right"
            title={<ExpandedDate date={comment.postedAt} />}
          >
            {moment(new Date(comment.postedAt)).fromNow()}
          </LWTooltip>
        </div>
        <div className={classes.preview}>
          {comment.contents?.plaintextMainText}
        </div>
      </div>
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
            comment={comment}
            treeOptions={{
              ...treeOptions,
              hideReply: true,
              forceSingleLine: false,
              forceNotSingleLine: true,
            }}
            hoverPreview
          />
        </div>
      </LWPopper>
    </div>
  );
}

export default registerComponent(
  "CommentsDraftListItem",
  CommentsDraftListItem, {
    styles,
    // TODO check this before merging
    hocs: [withErrorBoundary],
    areEqual: {
      treeOptions: "shallow",
    },
  },
);
