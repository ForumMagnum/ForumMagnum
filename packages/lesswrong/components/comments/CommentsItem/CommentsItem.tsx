import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import withErrorBoundary from '../../common/withErrorBoundary';
import { useCurrentUser } from '../../common/withUser';
import { Link } from '../../../lib/reactRouterWrapper';
import { tagGetCommentLink } from "../../../lib/collections/tags/helpers";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../commentTree';
import { commentAllowTitle as commentAllowTitle, commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR, reviewIsActive, eligibleToNominate } from '../../../lib/reviewUtils';
import startCase from 'lodash/startCase';
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import { metaNoticeStyles } from './CommentsItemMeta';
import { getVotingSystemByName } from '../../../lib/voting/getVotingSystem';
import { useVote } from '../../votes/withVote';
import { VotingProps } from '../../votes/votingProps';
import { isFriendlyUI } from '../../../themes/forumTheme';
import type { ContentItemBody } from '../../common/ContentItemBody';
import { CommentsList, CommentsListWithParentMetadata } from '@/lib/generated/gql-codegen/graphql';
import { TagCommentType } from '@/lib/collections/comments/types';

export const highlightSelectorClassName = "highlighted-substring";
export const dimHighlightClassName = "dim-highlighted-substring";
export const faintHighlightClassName = "dashed-highlighted-substring";


const styles = (theme: ThemeType) => ({
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
    fontWeight: isFriendlyUI ? 600 : theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    fontSize: isFriendlyUI ? "1.1rem" : undefined,
    "@media print": {
      display: "none",
    },
  },
  firstParentComment: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5
  },
  replyForm: {
    marginTop: 2,
    marginBottom: 8,
    border: theme.palette.border.normal,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 0,
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
  pinnedIcon: isFriendlyUI
    ? {
      width: 16,
      height: 16,
      padding: 1.5,
    }
    : {
      "--icon-size": "12px",
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
  excerpt: {
    marginBottom: 8,
  },
});

/**
 * CommentsItem: A single comment, not including any recursion for child comments
 *
 * Before adding more props to this, consider whether you should instead be adding a field to the CommentTreeOptions interface.
 */
export const CommentsItem = ({
  treeOptions,
  comment,
  nestingLevel=1,
  isChild,
  collapsed,
  isParentComment,
  parentCommentId,
  scrollIntoView,
  toggleCollapse,
  setSingleLine,
  truncated,
  showPinnedOnProfile,
  parentAnswerId,
  enableGuidelines=true,
  showParentDefault=false,
  displayTagIcon=false,
  excerptLines,
  className,
  classes,
}: {
  treeOptions: CommentTreeOptions,
  comment: CommentsList|CommentsListWithParentMetadata,
  nestingLevel: number,
  isChild?: boolean,
  collapsed?: boolean,
  isParentComment?: boolean,
  parentCommentId?: string,
  scrollIntoView?: () => void,
  toggleCollapse?: () => void,
  setSingleLine?: (singleLine: boolean) => void,
  truncated: boolean,
  showPinnedOnProfile?: boolean,
  parentAnswerId?: string,
  enableGuidelines?: boolean,
  showParentDefault?: boolean,
  displayTagIcon?: boolean,
  excerptLines?: number,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const commentBodyRef = useRef<ContentItemBody|null>(null); // passed into CommentsItemBody for use in InlineReactSelectionWrapper
  const [replyFormIsOpen, setReplyFormIsOpen] = useState(false);
  const [showEditState, setShowEditState] = useState(false);
  const [showParentState, setShowParentState] = useState(showParentDefault);
  const isMinimalist = treeOptions.formStyle === "minimalist"
  const currentUser = useCurrentUser();

  const {
    postPage, tag, post, refetch, showPostTitle, hideReviewVoteButtons,
    moderatedCommentId, hideParentCommentToggleForTopLevel,
  } = treeOptions;

  const showCommentTitle = !!(commentAllowTitle({tagCommentType: comment.tagCommentType as TagCommentType, parentCommentId: comment.parentCommentId}) && comment.title && !comment.deleted && !showEditState)

  const openReplyForm = (event: React.MouseEvent) => {
    event.preventDefault();
    setReplyFormIsOpen(true);
  }

  const closeReplyForm = () => {
    setReplyFormIsOpen(false);
  }

  const replySuccessCallback = () => {
    if (refetch) {
      refetch()
    }
    setReplyFormIsOpen(false);
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

  const renderBodyOrEditor = (voteProps: VotingProps<VoteableTypeClient>) => {
    if (showEditState) {
      return <Components.CommentsEditForm
        comment={comment}
        successCallback={editSuccessCallback}
        cancelCallback={editCancelCallback}
      />
    } else if (excerptLines) {
      return <Components.CommentExcerpt
        comment={comment}
        lines={excerptLines}
        className={classes.excerpt}
      />
    } else {
      return <Components.CommentBody
        commentBodyRef={commentBodyRef}
        truncated={truncated}
        collapsed={collapsed}
        comment={comment}
        postPage={postPage}
        voteProps={voteProps}
      />
    }
  }

  const renderReply = () => {
    const levelClass = (nestingLevel + (treeOptions.switchAlternatingHighlights ? 0 : 1)) % 2 === 0
      ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames(classes.replyForm, levelClass, isMinimalist && classes.replyFormMinimalist)}>
        <Components.CommentsNewForm
          post={treeOptions.post}
          parentComment={comment}
          successCallback={replySuccessCallback}
          cancelCallback={closeReplyForm}
          prefilledProps={{
            parentAnswerId: parentAnswerId ? parentAnswerId : null
          }}
          type="reply"
          enableGuidelines={enableGuidelines}
          formStyle={treeOptions.formStyle}
        />
      </div>
    )
  }

  const {
    CommentDiscussionIcon, LWTooltip, PostsTooltip, ReviewVotingWidget,
    LWHelpIcon, CoreTagIcon, CommentsItemMeta, RejectedReasonDisplay,
    HoveredReactionContextProvider, CommentBottom,
  } = Components;

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);

  const displayReviewVoting = 
    !hideReviewVoteButtons &&
    reviewIsActive() &&
    comment.reviewingForReview === REVIEW_YEAR+"" &&
    post &&
    currentUser?._id !== post.userId &&
    eligibleToNominate(currentUser)

  const voteProps = useVote(comment, "Comments", votingSystem);
  const showInlineCancel = replyFormIsOpen && isMinimalist

  return (
    <AnalyticsContext pageElementContext="commentItem" commentId={comment._id}>
    <HoveredReactionContextProvider voteProps={voteProps}>
      <div className={classNames(
        classes.root,
        className,
        "recent-comments-node",
        comment.deleted && !comment.deletedPublic && classes.deleted,
        treeOptions.isSideComment && classes.sideComment,
        comment.tagCommentType === "SUBFORUM" && !comment.topLevelCommentId && classes.subforumTop,
      )}>
        { comment.parentCommentId && showParentState && (
          <div className={classes.firstParentComment}>
            <Components.ParentCommentSingle
              post={post} tag={tag}
              documentId={comment.parentCommentId}
              nestingLevel={nestingLevel - 1}
              truncated={showParentDefault}
              key={comment.parentCommentId}
              treeOptions={{
                hideParentCommentToggleForTopLevel,
              }}
            />
          </div> 
        )}
        
        <div className={classes.postTitleRow}>
          {showPinnedOnProfile && comment.isPinnedOnProfile && <div className={classes.pinnedIconWrapper}>
            <Components.ForumIcon icon="Pin" className={classes.pinnedIcon} />
          </div>}
          {moderatedCommentId === comment._id && <FlagIcon className={classes.flagIcon} />}
          {showPostTitle && !isChild && hasPostField(comment) && comment.post && <PostsTooltip inlineBlock postId={comment.postId}>
              <Link className={classes.postTitle} to={commentGetPageUrlFromIds({postId: comment.postId, commentId: comment._id, postSlug: ""})}>
                {comment.post.draft && "[Draft] "}
                {comment.post.title}
              </Link>
            </PostsTooltip>}
          {showPostTitle && !isChild && hasTagField(comment) && comment.tag && <Link className={classes.postTitle} to={tagGetCommentLink({tagSlug: comment.tag.slug, tagCommentType: comment.tagCommentType})}>
            {startCase(comment.tag.name)}
          </Link>}
        </div>
        <div className={classNames(classes.body)}>
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
          {comment.rejected && <p><RejectedReasonDisplay reason={comment.rejectedReason ?? null}/></p>}
          {renderBodyOrEditor(voteProps)}
          {!comment.deleted && !collapsed && <CommentBottom
            comment={comment}
            post={post}
            treeOptions={treeOptions}
            votingSystem={votingSystem}
            voteProps={voteProps}
            commentBodyRef={commentBodyRef}
            replyButton={
              treeOptions?.replaceReplyButtonsWith?.(comment) || <a
                className={classNames("comments-item-reply-link", classes.replyLink)}
                onClick={showInlineCancel ? closeReplyForm : openReplyForm}
              >
                {showInlineCancel ? "Cancel" : "Reply"}
              </a>
            }
          />}
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
        { replyFormIsOpen && !collapsed && renderReply() }
      </div>
    </HoveredReactionContextProvider>
    </AnalyticsContext>
  )
}

const CommentsItemComponent = registerComponent(
  'CommentsItem', CommentsItem, {
    styles,
    stylePriority: -1,
    hocs: [withErrorBoundary],
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
