import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { commentBodyStyles } from "../../themes/stylePiping";
import { useHover } from "../common/withHover";
import { isMobile } from "../../lib/utils/isMobile";
import SubdirectoryArrowLeft from "@material-ui/icons/SubdirectoryArrowLeft";
import { commentGetPageUrlFromIds } from "../../lib/collections/comments/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    color: theme.palette.greyAlpha(0.5),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.small,
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: "10px 14px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    ...theme.typography.commentStyle,
  },
  wrap: {
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap",
    },
    rowGap: "6px",
  },
  postTitle: {
    flexGrow: 1,
    display: "inline-block",
    [theme.breakpoints.up('sm')]: {
      textAlign: "right",
      marginLeft: 8,
    },
    '& a, & a:hover, & a:active': {
      color: theme.palette.primary.main,
      '& u': {
        textDecoration: "none"
      }
    },
    fontSize: "15px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 0,
    marginBottom: 0,
  },
  post: {
    whiteSpace: "nowrap",
  },
  postRead: {
    color: theme.palette.text.dim55,
  },
  username: {
    fontWeight: 600,
    color: theme.palette.text.primary,
    whiteSpace: "nowrap",
    marginRight: 10,
  },
  bodyWrapper: {},
  bodyCursor: {
    cursor: "pointer",
  },
  body: {
    ...commentBodyStyles(theme)
  },
  bodyCollapsed: {
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  hoverOver: {
    width: 600,
  },
  showParentComment: {
    paddingRight: theme.spacing.unit,
    cursor: "pointer",
    color: theme.palette.icon.slightlyDim2,
  },
  icon: {
    fontSize: 12,
    transform: "rotate(90deg)"
  },
});

const useParentCommentLinkAndTooltip = ({ comment, classes }: {
  comment: CommentsListWithParentMetadata,
  classes: ClassesType<typeof styles>,
}) => {
  const { LWPopper, CommentById } = Components;

  const { eventHandlers, hover, anchorEl } = useHover({
    eventProps: {
      pageElementContext: "popularCommentParentTooltip",
      commentId: comment._id,
    },
  });

  if (!comment.parentCommentId) {
    return {};
  }

  const displayHoverOver = hover && !isMobile();

  const parentCommentTooltip = (
    <LWPopper
      open={displayHoverOver}
      anchorEl={anchorEl}
      placement="bottom-start"
      clickable={false}
    >
      <div className={classes.hoverOver}>
        <CommentById
          nestingLevel={1}
          commentId={comment.parentCommentId}
          treeOptions={{
            post: comment.post ?? undefined,
            showCollapseButtons: true,
            hideReply: true,
            forceSingleLine: false,
            forceNotSingleLine: true,
          }}
        />
      </div>
    </LWPopper>
  );

  const parentCommentUrl = commentGetPageUrlFromIds({
    postId: comment.post?._id,
    commentId: comment.parentCommentId,
    permalink: false,
  });

  const parentCommentLink = (
    <div className={classes.showParentComment} {...eventHandlers}>
      <Link rel="nofollow" to={parentCommentUrl}>
        <SubdirectoryArrowLeft className={classes.icon} />
      </Link>
    </div>
  );

  return { parentCommentTooltip, parentCommentLink };
};

const PopularCommentPostLink = ({ post, classes }: {
  post: NonNullable<Pick<CommentsListWithParentMetadata, "post">["post"]>,
  classes: ClassesType<typeof styles>,
}) => {
  const { isRead } = useRecordPostView(post);
  const { PostsTooltip } = Components;
  return (
    <div className={classes.postTitle}>
      <PostsTooltip postId={post._id}>
        <Link
          to={postGetPageUrl(post)}
          className={classNames(classes.post, {[classes.postRead]: isRead})}
          eventProps={{intent: 'expandPost'}}
        >
          {post.title}
        </Link>
      </PostsTooltip>
    </div>
  );
};

const LWPopularComment = ({comment, classes}: {
  comment: CommentsListWithParentMetadata,
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersName, CommentsItemDate, SmallSideVote, CommentBody } = Components;
  
  const { captureEvent } = useTracking();

  const [expanded, setExpanded] = useState(false);

  const onClickCallback = useCallback(() => {
    setExpanded(!expanded);
    captureEvent("popularCommentToggleExpanded", { expanded: !expanded });
  }, [expanded, captureEvent]);

  // We have a separate wrapper because we don't want clicking on the expanded comment body to close it again
  const onClickCommentBody = useCallback((_e: React.MouseEvent) => {
    if (!expanded) {
      onClickCallback();
    }
  }, [expanded, onClickCallback]);

  const { parentCommentLink, parentCommentTooltip } = useParentCommentLinkAndTooltip({ comment, classes });

  const username = <UsersName user={comment.user} className={classes.username} />;

  const commentDate = (
    <CommentsItemDate comment={comment} post={comment.post} preventDateFormatting />
  );

  const votingElement = !comment.debateResponse && !comment.rejected && (
    <SmallSideVote
      document={comment}
      collectionName="Comments"
      hideKarma={comment.post?.hideCommentKarma}
    />
  );

  const postLink = comment.post && (
    <PopularCommentPostLink
      post={comment.post}
      classes={classes}
    />
  );
  
  const commentBody = (
    <div onClick={onClickCommentBody} className={classNames(classes.bodyWrapper, { [classes.bodyCursor]: !expanded })}>
      {expanded
        ? <CommentBody comment={comment} className={classes.body} />
        : <div className={classNames(classes.body, classes.bodyCollapsed)}>
            {htmlToTextDefault(comment.contents?.html)}
          </div>}
    </div>
  );

  return (
    <AnalyticsContext
      pageElementContext="popularComment"
      commentId={comment._id}
      postId={comment.post?._id}
    >
      <div className={classes.root}>
        <div className={classNames(classes.row, classes.wrap)}>
          {parentCommentLink}
          {username}
          {commentDate}
          {votingElement}
          {postLink}
        </div>
        {commentBody}
        {parentCommentTooltip}
      </div>
    </AnalyticsContext>
  );
}

const LWPopularCommentComponent = registerComponent(
  "LWPopularComment",
  LWPopularComment,
  {styles},
);

declare global {
  interface ComponentTypes {
    LWPopularComment: typeof LWPopularCommentComponent
  }
}
