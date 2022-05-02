import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { userIsAllowedToComment } from '../../../lib/collections/users/helpers';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import withErrorBoundary from '../../common/withErrorBoundary';
import { useCurrentUser } from '../../common/withUser';
import { Link } from '../../../lib/reactRouterWrapper';
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import { Comments } from "../../../lib/collections/comments";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../commentTree';
import { commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { forumTypeSetting } from '../../../lib/instanceSettings';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR, reviewIsActive, eligibleToNominate } from '../../../lib/reviewUtils';
import { useCurrentTime } from '../../../lib/utils/timeUtil';

const isEAForum= forumTypeSetting.get() === "EAForum"

// Shared with ParentCommentItem
export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    "&:hover $menu": {
      opacity:1
    }
  },
  body: {
    borderStyle: "none",
    padding: 0,
    ...theme.typography.commentStyle,
  },
  menu: {
    opacity:.35,
    marginRight:-5,
    float: "right",
  },
  replyLink: {
    marginRight: 5,
    display: "inline",
    color: "rgba(0,0,0,.5)",
    "@media print": {
      display: "none",
    },
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
    }
  },
  firstParentComment: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5
  },
  meta: {
    "& > div": {
      display: "inline-block",
      marginRight: 5,
    },

    marginBottom: 8,
    color: "rgba(0,0,0,0.5)",
    paddingTop: ".6em",

    "& a:hover, & a:active": {
      textDecoration: "none",
      color: "rgba(0,0,0,0.3) !important",
    },
  },
  bottom: {
    paddingBottom: 5,
    fontSize: 12,
    minHeight: 12
  },
  replyForm: {
    marginTop: 2,
    marginBottom: 8,
    border: "solid 1px rgba(0,0,0,.2)",
  },
  deleted: {
    backgroundColor: "#ffefef",
  },
  moderatorHat: {
    marginRight: 8,
  },
  username: {
    marginRight: 10,
  },
  metaNotice: {
    color: theme.palette.lwTertiary.main,
    fontStyle: "italic",
    fontSize: "1rem",
    marginBottom: theme.spacing.unit,
    marginLeft: theme.spacing.unit/2
  },
  postTitle: {
    paddingTop: theme.spacing.unit,
    ...theme.typography.commentStyle,
    display: "block",
    color: theme.palette.grey[600]
  },
  reviewVotingButtons: {
    borderTop: "solid 1px rgba(0,0,0,.2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 6,
  },
  updateVoteMessage: {
    ...theme.typography.body2,
    ...theme.typography.smallText,
    color: theme.palette.grey[600]
  }
})

export const CommentsItem = ({ treeOptions, comment, nestingLevel=1, isChild, collapsed, isParentComment, parentCommentId, scrollIntoView, toggleCollapse, setSingleLine, truncated, parentAnswerId, classes }: {
  treeOptions: CommentTreeOptions,
  comment: CommentsList|CommentsListWithParentMetadata,
  nestingLevel: number,
  isChild?: boolean,
  collapsed?: boolean,
  isParentComment?: boolean,
  parentCommentId?: string,
  scrollIntoView?: ()=>void,
  toggleCollapse?: ()=>void,
  setSingleLine?: (boolean)=>void,
  truncated: boolean,
  parentAnswerId?: string|undefined,
  classes: ClassesType,
}) => {
  const [showReplyState, setShowReplyState] = useState(false);
  const [showEditState, setShowEditState] = useState(false);
  const [showParentState, setShowParentState] = useState(false);
  const now = useCurrentTime();
  
  const currentUser = useCurrentUser();

  const { postPage, tag, post, refetch, hideReply, showPostTitle, singleLineCollapse, hideReviewVoteButtons } = treeOptions;

  const showReply = (event: React.MouseEvent) => {
    event.preventDefault();
    setShowReplyState(true);
  }

  const replyCancelCallback = () => {
    setShowReplyState(false);
  }

  const replySuccessCallback = () => {
    if (refetch) {
      refetch()
    }
    setShowReplyState(false);
  }

  const setShowEdit = () => {
    setShowEditState(true);
  }

  const editCancelCallback = () => {
    setShowEditState(false);
  }

  const editSuccessCallback = () => {
    if (refetch) {
      refetch()
    }
    setShowEditState(false);
  }

  const toggleShowParent = () => {
    setShowParentState(!showParentState);
  }
  
  const renderMenu = () => {
    const { CommentsMenu } = Components;
    return (
      <AnalyticsContext pageElementContext="tripleDotMenu">
        <CommentsMenu
          className={classes.menu}
          comment={comment}
          post={post}
          tag={tag}
          showEdit={setShowEdit}
        />
      </AnalyticsContext>
    )
  }
  
  const renderBodyOrEditor = () => {
    if (showEditState) {
      return <Components.CommentsEditForm
        comment={comment}
        successCallback={editSuccessCallback}
        cancelCallback={editCancelCallback}
      />
    } else {
      return <Components.CommentBody
        truncated={truncated}
        collapsed={collapsed}
        comment={comment}
        postPage={postPage}
      />
    }
  }

  const renderCommentBottom = () => {
    const { CommentBottomCaveats } = Components

    const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > now;

    const showReplyButton = (
      !hideReply &&
      !comment.deleted &&
      (!blockedReplies || userCanDo(currentUser,'comments.replyOnBlocked.all')) &&
      // FIXME userIsAllowedToComment depends on some post metadatadata that we
      // often don't want to include in fragments, producing a type-check error
      // here. We should do something more complicated to give client-side feedback
      // if you're banned.
      // @ts-ignore
      (!currentUser || userIsAllowedToComment(currentUser, treeOptions.post))
    )

    return (
      <div className={classes.bottom}>
        <CommentBottomCaveats comment={comment}/>
        { showReplyButton &&
          <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={showReply}>
            Reply
          </a>
        }
      </div>
    )
  }

  const renderReply = () => {
    const levelClass = (nestingLevel + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames(classes.replyForm, levelClass)}>
        <Components.CommentsNewForm
          post={treeOptions.post}
          parentComment={comment}
          successCallback={replySuccessCallback}
          cancelCallback={replyCancelCallback}
          prefilledProps={{
            parentAnswerId: parentAnswerId ? parentAnswerId : null
          }}
          type="reply"
        />
      </div>
    )
  }
  
  const { ShowParentComment, CommentsItemDate, CommentUserName, CommentShortformIcon, SmallSideVote, LWTooltip, PostsPreviewTooltipSingle, ReviewVotingWidget, LWHelpIcon } = Components

  if (!comment) {
    return null;
  }

  const displayReviewVoting = 
    !hideReviewVoteButtons &&
    reviewIsActive() &&
    comment.reviewingForReview === REVIEW_YEAR+"" &&
    post &&
    currentUser?._id !== post.userId &&
    eligibleToNominate(currentUser)
  
  return (
    <AnalyticsContext pageElementContext="commentItem" commentId={comment._id}>
      <div className={classNames(
        classes.root,
        "recent-comments-node",
        {
          [classes.deleted]: comment.deleted && !comment.deletedPublic,
        },
      )}>
        { comment.parentCommentId && showParentState && (
          <div className={classes.firstParentComment}>
            <Components.ParentCommentSingle
              post={post} tag={tag}
              documentId={comment.parentCommentId}
              nestingLevel={nestingLevel - 1}
              truncated={false}
              key={comment.parentCommentId}
            />
          </div>
        )}

        {showPostTitle && !isChild && hasPostField(comment) && comment.post && <LWTooltip tooltip={false} title={<PostsPreviewTooltipSingle postId={comment.postId}/>}>
            <Link className={classes.postTitle} to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}>
              {comment.post.draft && "[Draft] "}
              {comment.post.title}
            </Link>
          </LWTooltip>}
        {showPostTitle && !isChild && hasTagField(comment) && comment.tag && <Link className={classes.postTitle} to={tagGetUrl(comment.tag)}>{comment.tag.name}</Link>}

        <div className={classes.body}>
          <div className={classes.meta}>
            { !parentCommentId && !comment.parentCommentId && isParentComment &&
              <div className={classes.usernameSpacing}>○</div>
            }
            {post && <CommentShortformIcon comment={comment} post={post} />}
            { parentCommentId!=comment.parentCommentId && parentAnswerId!=comment.parentCommentId &&
              <ShowParentComment
                comment={comment}
                active={showParentState}
                onClick={toggleShowParent}
              />
            }
            { (postPage || collapsed) && <a className={classes.collapse} onClick={toggleCollapse}>
              [<span>{collapsed ? "+" : "-"}</span>]
            </a>
            }
            {singleLineCollapse && <a className={classes.collapse} onClick={() => 
              setSingleLine && setSingleLine(true)}>
              [<span>{collapsed ? "+" : "-"}</span>]
            </a>
            }
            <CommentUserName comment={comment} className={classes.username}/>
            <CommentsItemDate
              comment={comment} post={post} tag={tag}
              scrollIntoView={scrollIntoView}
              scrollOnClick={postPage && !isParentComment}
            />
            {comment.moderatorHat && <span className={classes.moderatorHat}>
              Moderator Comment
            </span>}
            <SmallSideVote
              document={comment}
              collection={Comments}
              hideKarma={post?.hideCommentKarma}
            />

            {!isParentComment && renderMenu()}
            {post && <Components.CommentOutdatedWarning comment={comment} post={post}/>}
            
            {comment.nominatedForReview && <Link to={`/nominations/${comment.nominatedForReview}`} className={classes.metaNotice}>
              {`Nomination for ${comment.nominatedForReview} Review`}
            </Link>}

            {comment.reviewingForReview && <Link to={`/reviews/${comment.reviewingForReview}`} className={classes.metaNotice}>
              {`Review for ${isEAForum && comment.reviewingForReview === '2020' ? 'the Decade' : comment.reviewingForReview} Review`}
            </Link>}
            
          </div>
          { comment.promoted && comment.promotedByUser && <div className={classes.metaNotice}>
            Promoted by {comment.promotedByUser.displayName}
          </div>}
          {renderBodyOrEditor()}
          {!comment.deleted && !collapsed && renderCommentBottom()}
        </div>
        {displayReviewVoting && !collapsed && <div className={classes.reviewVotingButtons}>
          <div className={classes.updateVoteMessage}>
            <LWTooltip title={`If this review changed your mind, update your ${REVIEW_NAME_IN_SITU} vote for the original post `}>
              Update your {REVIEW_NAME_IN_SITU} vote for this post. 
              <LWHelpIcon/>
            </LWTooltip>
          </div>
          {post && <ReviewVotingWidget post={post} showTitle={false}/>}
        </div>}
        { showReplyState && !collapsed && renderReply() }
      </div>
    </AnalyticsContext>
  )
}

const CommentsItemComponent = registerComponent(
  'CommentsItem', CommentsItem, {
    styles, hocs: [withErrorBoundary],
    areEqual: {
      treeOptions: "shallow",
    },
  }
);

function hasPostField(comment: CommentsList | CommentsListWithParentMetadata): comment is CommentsListWithParentMetadata {
  return !!(comment as CommentsListWithParentMetadata).post
}

function hasTagField(comment: CommentsList | CommentsListWithParentMetadata): comment is CommentsListWithParentMetadata {
  return !!(comment as CommentsListWithParentMetadata).tag
}

declare global {
  interface ComponentTypes {
    CommentsItem: typeof CommentsItemComponent,
  }
}
