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
import { commentAllowTitle as commentAllowTitle, commentGetDefaultView, commentGetPageUrlFromIds } from '../../../lib/collections/comments/helpers';
import { isEAForum } from '../../../lib/instanceSettings';
import { REVIEW_NAME_IN_SITU, REVIEW_YEAR, reviewIsActive, eligibleToNominate } from '../../../lib/reviewUtils';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import startCase from 'lodash/startCase';
import FlagIcon from '@material-ui/icons/Flag';
import { hideUnreviewedAuthorCommentsSettings } from '../../../lib/publicSettings';
import { metaNoticeStyles } from './CommentsItemMeta';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';
import { useVote } from '../../votes/withVote';
import { VotingProps } from '../../votes/votingProps';
import {useMulti} from '../../../lib/crud/withMulti';
import {isValidCommentView} from '../../../lib/commentViewOptions';
import {useSubscribedLocation} from '../../../lib/routeUtil';
import {useHover} from '../../common/withHover';
import {trustLevel1Group} from '../../../lib/permissions';
import Button from '@material-ui/core/Button';
import {UseSingleProps, useSingle} from '../../../lib/crud/withSingle';
import {fade} from '@material-ui/core/styles/colorManipulator';


export const highlightSelectorClassName = "highlighted-substring";
export const dimHighlightClassName = "dim-highlighted-substring";
export const faintHighlightClassName = "dashed-highlighted-substring";
export const lwReactStyles = (theme: ThemeType): JssStyles => ({
    '&:hover .react-hover-style': {
      filter: "opacity(0.8)",
    },
    // mark.js applies a default highlight of yellow background and black text. 
    // we need to override to apply our own themes, and avoid being unreadable in dark mode
    [`& .${faintHighlightClassName}`]: {
      backgroundColor: "unset",
      color: "unset",
    },
    [`& .${highlightSelectorClassName}`]: {
      backgroundColor: theme.palette.background.primaryTranslucentHeavy,
      color: "unset",
    },
    [`& .${dimHighlightClassName}`]: {
      backgroundColor: theme.palette.grey[200],
      color: "unset",
    },
    [`&:hover .${faintHighlightClassName}`]: {
      borderBottom: theme.palette.border.dashed500,
      color: "unset",
    },
  })


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
    fontWeight: isEAForum ? 600 : theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    fontSize: isEAForum ? "1.1rem" : undefined,
    "@media print": {
      display: "none",
    },
  },
  firstParentComment: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5
  },
  bottom: {
    paddingBottom: isEAForum ? 12 : 5,
    paddingTop: isEAForum ? 4 : undefined,
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
  lwReactStyling: lwReactStyles(theme),
  debateBodySidebar: {
    width: 500,
    backgroundColor: theme.palette.background.default,
    marginLeft: 650,
    padding: 10,  
    border: theme.palette.border.normal,
    borderRadius: theme.borderRadius.small,
    maxHeight: "80vh",
    overflowY: "hidden",
    overflowX: "hidden",
    "&:hover": {
      overflowY: "scroll",
    },
    "@media (max-width: 600px)": {
      display: "none"
    },
  },
  asideButton: {
    padding: 10,
    paddingTop: 4,
    paddingBottom: 4,
    margin: 8,
    textTransform: "none",
    borderRadius: 2,
    color: theme.palette.text.alwaysBlack,
    borderColor: fade(theme.palette.text.alwaysBlack, 0.16)
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
  const [isChatentry, setIsChatentry] = useState(false);
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

  const renderBodyOrEditor = (voteProps: VotingProps<VoteableTypeClient>) => {
    if (showEditState) {
      return <Components.CommentsEditForm
        comment={comment}
        successCallback={editSuccessCallback}
        cancelCallback={editCancelCallback}
      />
    } else {
      return (<div ref={commentItemRef}>
        <Components.CommentBody truncated={truncated} collapsed={collapsed} comment={comment} postPage={postPage}     
          commentBodyHighlights={commentBodyHighlights} commentItemRef={commentItemRef} voteProps={voteProps}
        />
      </div>
      );
    }
  }

  const renderCommentBottom = (voteProps: VotingProps<VoteableTypeClient>) => {
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
      (!currentUser || userIsAllowedToComment(currentUser, treeOptions.post ?? null, null, true)) &&
      (!commentHidden || userCanDo(currentUser, 'posts.moderate.all'))
    )

    const showInlineCancel = showReplyState && isMinimalist
    const showChatButton = true

    // const { ReactionIcon } = Components
    const commentAuthor = comment.user?.displayName ?? "the comment author"

    const currentUserCommentedUpthread = (comment: CommentsList|CommentsListWithParentMetadata): boolean => {
      // Base case: if the comment is null or undefined, return false
      if (!comment) {
        return false;
      }
    
      // If the current user is the author of this comment, return true
      if (currentUser && comment.user && currentUser._id === comment.user._id) {
        return true;
      }
    
      // Recursively check the parent comment
      return currentUserCommentedUpthread(comment); // .parentComment);
    };
    
    const chatTooltipContent = <div>
      <strong>Create an aside about this comment</strong>
      <li>Only you and {commentAuthor} can write in the chat.</li>
      <li>There's no voting</li>
      <li>There are typing indicators</li>
      <li>Norms are a bit more informal and fast-paced</li>
      <li>Asides are collapsed for other users by default, but anyone can open them</li>
      <p>Think of it more like having a sidechannel 1-1 with {commentAuthor} (rather than "broadcasting" on a stage to the LessWrong audience) </p>
    </div>;

    return (
      <div className={classNames(classes.bottom,{[classes.bottomWithReacts]: !!VoteBottomComponent})}>
        <div>
          <CommentBottomCaveats comment={comment} />
          {showReplyButton && (
            treeOptions?.replaceReplyButtonsWith?.(comment)
            || <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={showInlineCancel ? replyCancelCallback : (event) => {setIsChatentry(false); showReply(event)}}>
              {showInlineCancel ? "Cancel" : "Reply"}
            </a>
          )}
          {showChatButton && (

            <LWTooltip title={chatTooltipContent}>
              {(
                <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={(event) => togglePopper(event) /* setIsChatentry(true); showReply(event)} */ }>
                  {/* <ReactionIcon react={"noun-chat"} size={24} />  */}
                  { asideAnchorEl ? "Cancel" : "Aside" }
                </a>
              )}
            </LWTooltip>
          )}
        </div>
        {VoteBottomComponent && <VoteBottomComponent
          document={comment}
          hideKarma={post?.hideCommentKarma}
          collection={Comments}
          votingSystem={votingSystem}
          commentItemRef={commentItemRef}
          voteProps={voteProps}
        />}
      </div>
    );
  }

  const chatCommentId = comment._id; //TODO: fix this to actually get the right parent id! 

  const renderReply = (chatentry : boolean) => {
    const levelClass = (nestingLevel + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames(classes.replyForm, levelClass, {[classes.replyFormMinimalist]: isMinimalist})}>
        <Components.CommentsNewForm
          post={treeOptions.post}
          parentComment={comment}
          successCallback={replySuccessCallback}
          cancelCallback={replyCancelCallback}
          prefilledProps={{
            parentAnswerId: parentAnswerId ? parentAnswerId : null,
            debateResponse: chatentry,
            title: chatCommentId // TODO: figure out what to do here instead of title.... 
          }}
          type="reply"
          enableGuidelines={enableGuidelines}
          replyFormStyle={treeOptions.replyFormStyle}
          removeFields={['af', 'debateResponse']}
        />
      </div>
    )
  }

  const {
    CommentDiscussionIcon, LWTooltip, PostsPreviewTooltipSingle, ReviewVotingWidget,
    LWHelpIcon, CoreTagIcon, CommentsItemMeta, RejectedReasonDisplay, DebateBody, LWPopper
  } = Components
  
  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const VoteBottomComponent = votingSystem.getCommentBottomComponent?.() ?? null;

  const displayReviewVoting = 
    !hideReviewVoteButtons &&
    reviewIsActive() &&
    comment.reviewingForReview === REVIEW_YEAR+"" &&
    post &&
    currentUser?._id !== post.userId &&
    eligibleToNominate(currentUser)

  const voteProps = useVote(comment, "Comments", votingSystem);

  const getDebateResponseBlocks = (responses: CommentsList[], replies: CommentsList[]) => responses.map(debateResponse => ({
    comment: debateResponse,
    replies: replies.filter(reply => reply.topLevelCommentId === debateResponse._id)
  }));

  const { results: debateResponses, refetch: refetchDebateResponses } = useMulti({
    terms: {
      view: 'debateResponses',
      postId: post?._id, // just use a fake debate here. 'debateid238r0w8rh0aw98h'
    },
    collectionName: 'Comments',
    fragmentName: 'CommentsList',
    skip: !post?.debate,
    limit: 1000
  });

  const location = useSubscribedLocation();
  const { query, params } = location;


  // const defaultView = commentGetDefaultView(post, currentUser)
  // If the provided view is among the valid ones, spread whole query into terms, otherwise just do the default query
  const commentOpts = {includeAdminViews: currentUser?.isAdmin};
  const commentTerms: CommentsViewTerms = isValidCommentView(query.view, commentOpts)
    ? {...(query as CommentsViewTerms), limit:1000}
    : {view: "postCommentsTop", limit: 1000}

  const { results: nonDebateComments } = useMulti({
    terms: {...commentTerms, postId: post?._id},
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    skip: !post?._id,
    fetchPolicy: 'cache-and-network',
  });

 // const debateResponseIds = new Set((debateResponses ?? []).map(response => response._id));
 // const debateResponseReplies = nonDebateComments?.filter(comment => debateResponseIds.has(comment.topLevelCommentId));
  //const debateResponseBlocks = debateResponses ? getDebateResponseBlocks(debateResponses, debateResponseReplies) : [];

  
  const currentCommentId = comment._id;
  const chatResponses = debateResponses ? debateResponses.filter(response =>  // TODO: only check one of these
    response.title ? response.title.includes( currentCommentId ) : false  ) : [];

//  console.log("chatResponses", chatResponses)
  //const chatResponseIds = new Set((chatResponses ?? []).map(response => response._id));
  const chatResponseBlocks = chatResponses ? getDebateResponseBlocks(chatResponses, []) : [];

  //const showChat = true // if parent has matching commentId to chatEntry

  // If there are any chatResponses in that array, then set asideConversant to the display name of the first one who has a different name than the author of the current comment
  const asideConversant = chatResponses.find(response => response.user?.displayName !== comment.user?.displayName)?.user?.displayName;


  
  const [asideAnchorEl, setAsideAnchorEl] = useState(null);

  const togglePopper = (event) => {
    if (asideAnchorEl) {
      setAsideAnchorEl(null);
    } else {
      setAsideAnchorEl(event.currentTarget);
    }
  }

  const fragmentName = 'PostsWithNavigationAndRevision' 
  const documentId = post?._id

  const fetchProps: UseSingleProps<"PostsWithNavigation"|"PostsWithNavigationAndRevision"> = {
    collectionName: "Posts",
    fragmentName,
    documentId,
  };

  const { document: debateBodyPost, loading, error } = useSingle<"PostsWithNavigation"|"PostsWithNavigationAndRevision">(fetchProps);


  return (
    <div>
      <AnalyticsContext pageElementContext="commentItem" commentId={comment._id}>
        <div className={classNames(
          classes.root,
          "recent-comments-node",
          {
            [classes.deleted]: comment.deleted && !comment.deletedPublic,
            [classes.sideComment]: treeOptions.isSideComment,
            [classes.subforumTop]: comment.tagCommentType === "SUBFORUM" && !comment.topLevelCommentId,
          },
        )}>
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
          <div className={classNames(classes.body, classes.lwReactStyling)}>
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
            {renderBodyOrEditor(voteProps)}
            
            {!comment.deleted && !collapsed && renderCommentBottom(voteProps)}
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
          { showReplyState && !collapsed && renderReply(isChatentry) }
        </div>
        <div>
          {chatResponses.length > 0 && /* add a material UI button */ 
            <Button variant="outlined" color="secondary" onClick={(event) => togglePopper(event)} className={classes.asideButton}>
              <span style={{ color: 'grey' }}>
                { asideAnchorEl ? "[-]" : "[+]" }
              </span>
              { asideAnchorEl ? <> Hide aside </> : <> Aside with </> } {asideConversant} ({chatResponses.length})
            </Button>}
        </div>
       
        {post && debateBodyPost &&
          <LWPopper
            open={!!asideAnchorEl}
            anchorEl={asideAnchorEl}
            placement="right-start"
            clickable={true}
          >
            <div className={classes.debateBodySidebar}>
              <DebateBody
                debateResponses={chatResponseBlocks}
                chatCommentId={chatCommentId}
                post={debateBodyPost}
              />
            </div>
        </LWPopper>
        }
      </AnalyticsContext>
      
    </div>
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
