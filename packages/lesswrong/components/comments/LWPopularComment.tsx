import React, { FC, useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { ExpandedDate } from "../common/FormatDate";
import { Link } from "../../lib/reactRouterWrapper";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Comments } from "../../lib/collections/comments";
import { htmlToTextDefault } from "../../lib/htmlToText";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import moment from "moment";
import { isFriendlyUI } from "../../themes/forumTheme";
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
    // cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
  },
  wrap: {
    flexWrap: "wrap",
    rowGap: "6px",
  },
  postTitle: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "end",
    '& a, & a:hover, & a:active': {
      color: theme.palette.primary.main,
      '& u': {
        textDecoration: "none"
      }
    },
    fontSize: '15px',
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
  link: {
    color: theme.palette.primary.main,
    fontWeight: isFriendlyUI ? 600 : undefined,
    whiteSpace: "nowrap",
    "&:hover": {
      opacity: 1,
      color: theme.palette.primary.light,
    },
  },
  username: {
    fontWeight: 600,
    color: theme.palette.text.primary,
    whiteSpace: "nowrap",
    marginRight: 10,
  },
  date: {
    color: theme.palette.grey[600],
    marginRight: 6,
  },
  bodyWrapper: {
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
  collapse: {
    marginRight: 5,
    opacity: 0.8,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    paddingBottom: 4,
    display: "inline-block",
    verticalAlign: "middle",
    "& span": {
      fontFamily: "monospace",
    },
  },
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
  const { UsersName, LWTooltip, SmallSideVote, CommentBody } = Components;
  
  const { captureEvent } = useTracking();
  const [expanded, setExpanded] = useState(false);

  const onClickCallback = useCallback(() => {
    setExpanded(!expanded);
    captureEvent("popularCommentToggleExpanded", { expanded: !expanded });
  }, [expanded, captureEvent]);

  const { onClick } = useClickableCell({ onClick: onClickCallback });

  const collapseToggle = <a className={classes.collapse} onClick={onClickCallback}>
    {<>[<span>{!expanded ? "+" : "-"}</span>]</>}
  </a>;

  const username = <UsersName user={comment.user} className={classes.username} />;

  const commentDate = (
    <div className={classes.date}>
      <LWTooltip
        placement="right"
        title={<ExpandedDate date={comment.postedAt} />}
      >
        {moment(new Date(comment.postedAt)).fromNow()}
      </LWTooltip>
    </div>
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
    <div className={classes.bodyWrapper}>
      {/* <InteractionWrapper> */}
        {expanded
          ? <CommentBody comment={comment} className={classes.body} />
          : <div className={classNames(classes.body, classes.bodyCollapsed)}>
              {htmlToTextDefault(comment.contents?.html)}
            </div>}
      {/* </InteractionWrapper> */}
    </div>
  );

  return (
    <AnalyticsContext
      pageElementContext="popularComment"
      commentId={comment._id}
      postId={comment.post?._id}
    >
      <div onClick={onClick} className={classes.root}>
        <InteractionWrapper className={classNames(classes.row, classes.wrap)}>
          {collapseToggle}
          {username}
          {commentDate}
          {votingElement}
          {postLink}
        </InteractionWrapper>
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
