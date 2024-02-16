import React, { FC, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Comments } from "../../lib/collections/comments";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { commentBodyStyles } from "../../themes/stylePiping";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    color: theme.palette.greyAlpha(0.5),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: "10px 14px",
  },
  row: {
    display: "flex",
    alignItems: "center",
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
    marginRight: 8,
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
  toggleWrapper: {
    marginRight: 5,
    paddingBottom: 2,
    opacity: 0.8,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    display: "flex",
    verticalAlign: "middle",
    "& span": {
      fontFamily: "monospace",
    },
  },
  toggleCharacter: {
    transform: 'translateY(0.75px)',
  }
});

const PopularCommentPostLink: FC<{
  post: NonNullable<Pick<CommentsListWithParentMetadata, "post">["post"]>,
  classes: ClassesType<typeof styles>,
}> = ({post, classes}) => {
  const {isRead} = useRecordPostView(post);
  const {PostsTooltip} = Components;
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
}

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
  const onClickCommentBody = useCallback((e: React.MouseEvent) => {
    if (!expanded) {
      onClickCallback();
    }
  }, [expanded, onClickCallback]);

  const collapseToggle = (
    <a className={classes.toggleWrapper} onClick={onClickCallback}>
      {<>[<span className={classes.toggleCharacter}>{!expanded ? "+" : "-"}</span>]</>}
    </a>
  );

  const username = <UsersName user={comment.user} className={classes.username} />;

  const commentDate = (
    <CommentsItemDate comment={comment} post={comment.post} />
  );

  const votingElement = !comment.debateResponse && !comment.rejected && (
    <SmallSideVote
      document={comment}
      collection={Comments}
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
    <div onClick={onClickCommentBody} className={classNames(classes.bodyWrapper, { [classes.bodyCursor] : !expanded })}>
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
          {collapseToggle}
          {username}
          {commentDate}
          {votingElement}
          {postLink}
        </div>
        {commentBody}
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
