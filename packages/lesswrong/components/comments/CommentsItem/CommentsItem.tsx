import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { userIsAllowedToComment } from '../../../lib/collections/users/helpers';
import { Comments } from '../../../lib/collections/comments/collection';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import classNames from 'classnames';
import withErrorBoundary from '../../common/withErrorBoundary';
import { useCurrentUser } from '../../common/withUser';
import { Link } from '../../../lib/reactRouterWrapper';
import { tagGetCommentLink } from "../../../lib/collections/tags/helpers";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../commentTree';
import { commentAllowTitle as commentAllowTitle, commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { isEAForum } from '../../../lib/instanceSettings';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR, reviewIsActive, eligibleToNominate } from '../../../lib/reviewUtils';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import startCase from 'lodash/startCase';
import FlagIcon from '@material-ui/icons/Flag';
import { hideUnreviewedAuthorCommentsSettings } from '../../../lib/publicSettings';
import { metaNoticeStyles } from './CommentsItemMeta';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    position: "relative",
    "&:hover .CommentsItemMeta-menu": {
      opacity:1
    }
  },
  subforumTop: {
    paddingTop: 4,
  },
  tagIcon: {
    marginRight: 6,
    '& svg': {
      width: 15,
      height: 15,
      fill: theme.palette.grey[600],
    },
  },
  body: {
    borderStyle: "none",
    padding: 0,
    ...theme.typography.commentStyle,
  },
  sideComment: {
    "& blockquote": {
      paddingRight: 0,
      marginLeft: 4,
      paddingLeft: 12,
    },
  },
  replyLink: {
    marginRight: 8,
    display: "inline",
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    "@media print": {
      display: "none",
    },
  },
  firstParentComment: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5
  },
  bottom: {
    paddingBottom: isEAForum ? theme.spacing.unit : 5,
    minHeight: 12,
    ...(isEAForum ? {} : {fontSize: 12}),
  },
  bottomWithReacts: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  replyForm: {
    marginTop: 2,
    marginBottom: 8,
    border: theme.palette.border.normal,
    borderRadius: isEAForum ? theme.borderRadius.small : 0,
  },
  replyFormMinimalist: {
    borderRadius: theme.borderRadius.small,
  },
  deleted: {
    backgroundColor: theme.palette.panelBackground.deletedComment,
  },
  metaNotice: {
    ...metaNoticeStyles(theme),
  },
  pinnedIconWrapper: {
    color: theme.palette.grey[400],
    paddingTop: 10,
    marginBottom: '-3px',
  },
  pinnedIcon: {
    fontSize: 12
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    flexGrow: 1,
    marginTop: 8,
    marginBottom: 0,
    marginLeft: 0,
    display: "block",
    fontSize: '1.5rem',
    lineHeight: '1.5em'
  },
  postTitle: {
    paddingTop: theme.spacing.unit,
    ...theme.typography.commentStyle,
    display: "block",
    color: theme.palette.link.dim2,
  },
  reviewVotingButtons: {
    borderTop: theme.palette.border.normal,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 6,
  },
  updateVoteMessage: {
    ...theme.typography.body2,
    ...theme.typography.smallText,
    color: theme.palette.grey[600]
  },
  postTitleRow: {
    display: 'flex',
    columnGap: 8,
    alignItems: 'center'
  },
  flagIcon: {
    height: 13,
    color: theme.palette.error.main,
    position: "relative",
    top: 3
  },
  replyIcon: {
    opacity: .3,
    height: 18,
    width: 18,
    position: "relative",
    top: 3
  },
  lwReactStyling: {
    '&:hover .react-hover-style': {
      filter: "opacity(0.8)",
    }
  }
});

/**
 * CommentsItem: A single comment, not including any recursion for child comments
 *
 * Before adding more props to this, consider whether you should instead be adding a field to the CommentTreeOptions interface.
 */
export const CommentsItem = ({ treeOptions, comment, nestingLevel=1, isChild, collapsed, isParentComment, parentCommentId, scrollIntoView, toggleCollapse, setSingleLine, truncated, showPinnedOnProfile, parentAnswerId, enableGuidelines=true, showParentDefault=false, displayTagIcon=false, classes }: {
  treeOptions: CommentTreeOptions,
  comment: CommentsList|CommentsListWithParentMetadata,
  nestingLevel: number,
  isChild?: boolean,
  collapsed?: boolean,
  isParentComment?: boolean,
  parentCommentId?: string,
  scrollIntoView?: ()=>void,
  toggleCollapse?: ()=>void,
  setSingleLine?: (singleLine: boolean)=>void,
  truncated: boolean,
  showPinnedOnProfile?: boolean,
  parentAnswerId?: string,
  enableGuidelines?: boolean,
  showParentDefault?: boolean,
  displayTagIcon?: boolean,
  classes: ClassesType,
}) => {
  const commentItemRef = useRef<HTMLDivElement|null>(null); // passed into CommentsItemBody for use in InlineReactSelectionWrapper
  const [showReplyState, setShowReplyState] = useState(false);
  const [showEditState, setShowEditState] = useState(false);
  const [showParentState, setShowParentState] = useState(showParentDefault);
  const [commentBodyHighlights, setCommentBodyHighlights] = useState<string[]>([]);
  const isMinimalist = treeOptions.replyFormStyle === "minimalist"
  const now = useCurrentTime();
  const currentUser = useCurrentUser();

  const {
    postPage, tag, post, refetch, hideReply, showPostTitle, hideReviewVoteButtons,
    moderatedCommentId,
  } = treeOptions;

  const showCommentTitle = !!(commentAllowTitle(comment) && comment.title && !comment.deleted && !showEditState)

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

  const renderBodyOrEditor = () => {
    if (showEditState) {
      return <Components.CommentsEditForm
        comment={comment}
        successCallback={editSuccessCallback}
        cancelCallback={editCancelCallback}
      />
    } else {
      return (
        <Components.CommentBody truncated={truncated} collapsed={collapsed} comment={comment} postPage={postPage}     
          commentBodyHighlights={commentBodyHighlights} commentItemRef={commentItemRef}
        />
      );
    }
  }

  const renderCommentBottom = () => {
    const { CommentBottomCaveats } = Components

    const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > now;

    const hideSince = hideUnreviewedAuthorCommentsSettings.get()
    const commentHidden = hideSince && new Date(hideSince) < new Date(comment.postedAt) &&
      comment.authorIsUnreviewed
    const showReplyButton = (
      !hideReply &&
      !comment.deleted &&
      (!blockedReplies || userCanDo(currentUser,'comments.replyOnBlocked.all')) &&
      // FIXME userIsAllowedToComment depends on some post metadatadata that we
      // often don't want to include in fragments, producing a type-check error
      // here. We should do something more complicated to give client-side feedback
      // if you're banned.
      // @ts-ignore
      (!currentUser || userIsAllowedToComment(currentUser, treeOptions.post)) &&
      (!commentHidden || userCanDo(currentUser, 'posts.moderate.all'))
    )

    const showInlineCancel = showReplyState && isMinimalist
    return (
      <div className={classNames(classes.bottom,{[classes.bottomWithReacts]: !!VoteBottomComponent})}>
        <div>
          <CommentBottomCaveats comment={comment} />
          {showReplyButton && (
            treeOptions?.replaceReplyButtonsWith?.(comment)
            || <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={showInlineCancel ? replyCancelCallback : showReply}>
              {showInlineCancel ? "Cancel" : "Reply"}
            </a>
          )}
        </div>
        {VoteBottomComponent && <VoteBottomComponent
          document={comment}
          hideKarma={post?.hideCommentKarma}
          collection={Comments}
          votingSystem={votingSystem}
          commentItemRef={commentItemRef}
        />}
      </div>
    );
  }

  const renderReply = () => {
    const levelClass = (nestingLevel + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames(classes.replyForm, levelClass, {[classes.replyFormMinimalist]: isMinimalist})}>
        <Components.CommentsNewForm
          post={treeOptions.post}
          parentComment={comment}
          successCallback={replySuccessCallback}
          cancelCallback={replyCancelCallback}
          prefilledProps={{
            parentAnswerId: parentAnswerId ? parentAnswerId : null
          }}
          type="reply"
          enableGuidelines={enableGuidelines}
          replyFormStyle={treeOptions.replyFormStyle}
        />
      </div>
    )
  }

  const {
    CommentDiscussionIcon, LWTooltip, PostsPreviewTooltipSingle, ReviewVotingWidget,
    LWHelpIcon, CoreTagIcon, CommentsItemMeta, RejectedReasonDisplay
  } = Components
  
  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const VoteBottomComponent = votingSystem.getCommentBottomComponent?.() ?? null;

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
        classes.lwReactStyling,
        "recent-comments-node",
        {
          [classes.deleted]: comment.deleted && !comment.deletedPublic,
          [classes.sideComment]: treeOptions.isSideComment,
          [classes.subforumTop]: comment.tagCommentType === "SUBFORUM" && !comment.topLevelCommentId,
        },
      )} ref={commentItemRef}>
        { comment.parentCommentId && showParentState && (
          <div className={classes.firstParentComment}>
            <Components.ParentCommentSingle
              post={post} tag={tag}
              documentId={comment.parentCommentId}
              nestingLevel={nestingLevel - 1}
              truncated={showParentDefault}
              key={comment.parentCommentId}
            />
          </div> 
        )}
        
        <div className={classes.postTitleRow}>
          {showPinnedOnProfile && comment.isPinnedOnProfile && <div className={classes.pinnedIconWrapper}>
            <Components.ForumIcon icon="Pin" className={classes.pinnedIcon} />
          </div>}
          {moderatedCommentId === comment._id && <FlagIcon className={classes.flagIcon} />}
          {showPostTitle && !isChild && hasPostField(comment) && comment.post && <LWTooltip tooltip={false} title={<PostsPreviewTooltipSingle postId={comment.postId}/>}>
              <Link className={classes.postTitle} to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}>
                {comment.post.draft && "[Draft] "}
                {comment.post.title}
              </Link>
            </LWTooltip>}
          {showPostTitle && !isChild && hasTagField(comment) && comment.tag && <Link className={classes.postTitle} to={tagGetCommentLink({tagSlug: comment.tag.slug, tagCommentType: comment.tagCommentType})}>
            {startCase(comment.tag.name)}
          </Link>}
        </div>
        <div className={classes.body}>
          {showCommentTitle && <div className={classes.title}>
            {(displayTagIcon && tag) ? <span className={classes.tagIcon}>
              <CoreTagIcon tag={tag} />
            </span> : <CommentDiscussionIcon
              comment={comment}
            />}
            {comment.title}
          </div>}
          <CommentsItemMeta
            {...{
              treeOptions,
              comment,
              showCommentTitle,
              isParentComment,
              parentCommentId,
              showParentState,
              toggleShowParent,
              scrollIntoView,
              parentAnswerId,
              setSingleLine,
              collapsed,
              toggleCollapse,
              setShowEdit,
            }}
          />
          {comment.promoted && comment.promotedByUser && <div className={classes.metaNotice}>
            Pinned by {comment.promotedByUser.displayName}
          </div>}
          {comment.rejected && <p><RejectedReasonDisplay reason={comment.rejectedReason}/></p>}
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
