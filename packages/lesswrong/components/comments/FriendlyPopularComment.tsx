import React, { FC, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { ExpandedDate } from "../common/FormatDate";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { commentGetPageUrl } from "../../lib/collections/comments/helpers";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import moment from "moment";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    color: theme.palette.greyAlpha(0.5),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[200]}`,
    padding: "8px 12px",
    cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
  },
  wrap: {
    flexWrap: "wrap",
    rowGap: "6px",
  },
  postWrapper: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: 8,
  },
  post: {
    color: theme.palette.grey[1000],
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  postRead: {
    color: theme.palette.grey[600],
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    whiteSpace: "nowrap",
    "&:hover": {
      opacity: 1,
      color: theme.palette.primary.light,
    },
  },
  username: {
    fontWeight: 600,
    whiteSpace: "nowrap",
    color: theme.palette.grey[1000],
    marginRight: 10,
  },
  date: {
    color: theme.palette.grey[600],
    marginRight: 6,
  },
  body: {
    lineHeight: "160%",
    letterSpacing: "-0.14px",
    color: theme.palette.grey[1000],
  },
  bodyCollapsed: {
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    // Maybe we revisit this in the future - Figma designs had a "Read more"
    // but this is spectacularly difficult
    // "&::before": {
      // content: '"(Show more)"',
      // float: "right",
      // marginTop: "1.5em",
      // color: theme.palette.primary.main,
      // fontWeight: 600,
      // "&:hover": {
        // color: theme.palette.primary.light,
      // },
    // },
  },
});

const PopularCommentTitle: FC<{
  comment: CommentsListWithParentMetadata,
  post: NonNullable<Pick<CommentsListWithParentMetadata, "post">["post"]>,
  classes: ClassesType<typeof styles>,
}> = ({comment, post, classes}) => {
  const {isRead} = useRecordPostView(post);
  const {PostsTooltip} = Components;
  return (
    <div className={classes.row}>
      <InteractionWrapper className={classes.postWrapper}>
        <PostsTooltip postId={post._id}>
          <Link
            to={postGetPageUrl(post)}
            className={classNames(classes.post, {[classes.postRead]: isRead})}
            eventProps={{intent: 'expandPost'}}
          >
            {post.title}
          </Link>
        </PostsTooltip>
      </InteractionWrapper>
      <InteractionWrapper>
        <Link to={commentGetPageUrl(comment)} className={classes.link} eventProps={{intent: 'viewInThread'}}>
          View in thread
        </Link>
      </InteractionWrapper>
    </div>
  );
}

const FriendlyPopularCommentInner = ({comment, classes}: {
  comment: CommentsListWithParentMetadata,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const [expanded, setExpanded] = useState(false);

  const onClickCallback = useCallback(() => {
    setExpanded(!expanded);
    captureEvent("popularCommentToggleExpanded", {expanded: !expanded});
  }, [expanded, captureEvent]);

  const {onClick} = useClickableCell({
    onClick: onClickCallback,
    ignoreLinks: true,
  });

  const {UsersName, LWTooltip, SmallSideVote, CommentBody} = Components;
  return (
    <AnalyticsContext
      pageElementContext="popularComment"
      commentId={comment._id}
      postId={comment.post?._id}
    >
      <div onClick={onClick} className={classes.root}>
        {comment.post &&
          <PopularCommentTitle
            post={comment.post}
            comment={comment}
            classes={classes}
          />
        }
        <InteractionWrapper className={classNames(classes.row, classes.wrap)}>
          <UsersName user={comment.user} className={classes.username} />
          <div className={classes.date}>
            <LWTooltip
              placement="right"
              title={<ExpandedDate date={comment.postedAt} />}
            >
              {moment(new Date(comment.postedAt)).fromNow()}
            </LWTooltip>
          </div>
          {!comment.debateResponse && !comment.rejected &&
            <SmallSideVote
              document={comment}
              collectionName="Comments"
              hideKarma={comment.post?.hideCommentKarma}
            />
          }
        </InteractionWrapper>
        {expanded
          ? (
            <CommentBody comment={comment} className={classes.body} />
          )
          : (
            <div className={classNames(classes.body, classes.bodyCollapsed)}>
              {htmlToTextDefault(comment.contents?.html ?? undefined)}
            </div>
          )
        }
      </div>
    </AnalyticsContext>
  );
}

export const FriendlyPopularComment = registerComponent(
  "FriendlyPopularComment",
  FriendlyPopularCommentInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    FriendlyPopularComment: typeof FriendlyPopularComment
  }
}
