import React, { useState } from "react";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import CommentsMenu from "../dropdowns/comments/CommentsMenu";
import CommentsItemDate from "../comments/CommentsItem/CommentsItemDate";
import UsersNameWithModal from "./UsersNameWithModal";
import UltraFeedCommentActions from "./UltraFeedCommentActions";
import SubdirectoryArrowLeft from "@/lib/vendor/@material-ui/icons/src/SubdirectoryArrowLeft";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import DebateIcon from "@/lib/vendor/@material-ui/icons/src/Forum";
import { FeedCommentMetaInfo } from "./ultraFeedTypes";
import UltraFeedMetaInfoPill from "./UltraFeedMetaInfoPill";
import { useUltraFeedContext } from "./UltraFeedContextProvider";

const styles = defineStyles("UltraFeedCommentsItemMeta", (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    flexDirection: 'column',
    
    alignItems: "baseline",
    justifyContent: 'space-between',
    color: `${theme.palette.ultraFeed.dim} !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.ultraFeedMobileStyle.fontSize,
    },
    "& > *": {
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'baseline',
    position: 'relative',
    width: '100%',
    paddingRight: 16,
    [theme.breakpoints.down('sm')]: {
      paddingRight: 20,
    }
  },
  tripleDotMenu: {
    opacity: 0.7,
    position: 'absolute',
    right: -20,
    top: -2,
    zIndex: 10,
    padding: '4px 10px 4px 4px',
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
      right: -8,
      padding: '4px'
    },
  },
  commentShortformIconContainer: {
    position: 'relative',
    bottom: 0,
    cursor: 'pointer',
    "&:hover": {
      opacity: 0.7,
    },
  },
  commentShortformIcon: {
    [theme.breakpoints.down('sm')]: {
      bottom: 10
    },
    cursor: "pointer",
    color: theme.palette.grey[600],
    width: 13,
    height: 13,
    marginLeft: -2,
    marginRight: theme.spacing.unit,
    position: "relative",
    top: 2
  },
  debateIconContainer: {
    position: 'relative',
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    "&:hover": {
      opacity: 0.7,
    },
  },
  debateIcon: {
    cursor: "pointer",
    color: theme.palette.grey[500],
    width: 16,
    height: 16,
    marginLeft: -2,
    marginRight: 6,
    position: "relative",
    top: 2,
  },
  username: {
    marginRight: 8,
    textWrap: "nowrap",
    fontWeight: 600,
    color: `${theme.palette.text.primary} !important`,
  },
  moderatorHat: {
    marginRight: 12,
    whiteSpace: "nowrap",
  },
  newContentDateStyling: {
  },
  date: {
    marginRight: 12,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.ultraFeedMobileStyle,
    },
  },
  sameRowPostTitle: {
    maxWidth: '70%',
    position: 'relative',
    marginLeft: 'auto',
    marginRight: 8,
    cursor: 'pointer',
    overflow: "hidden",
    wordBreak: 'break-all',
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
    backgroundColor: 'transparent',
    transition: 'background-color 1.5s ease-out',
    padding: '2px 8px',
    borderRadius: 4,
    [theme.breakpoints.down('sm')]: {
      marginRight: 20,
    }
  },
  sameRowPostTitleHighlighted: {
    backgroundColor: `${theme.palette.primary.main}3b`,
    transition: 'none',
  },
  abovePostTitle: {
    marginBottom: 8,
    marginRight: 16,
    color: theme.palette.link.dim,
    fontSize: '1.3rem',
    lineHeight: theme.typography.body2.lineHeight,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontStyle: 'italic',
    cursor: 'pointer',
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.ultraFeedMobileStyle.fontSize,
    },
    backgroundColor: 'transparent',
    transition: 'background-color 1.5s ease-out',
    padding: '4px 0px',
    borderRadius: 4,
  },
  abovePostTitleHighlighted: {
    backgroundColor: `${theme.palette.primary.main}3b`,
    transition: 'none',
  },
  postTitleReplyTo: {
    marginRight: 4,
  },
  postTitleLinkOrButtonSpan: {
    color: theme.palette.primary.main,
  },
  hideOnDesktop: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'unset',
    },
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  replyingToIcon: {
    fontSize: 14,
    transform: "rotate(90deg)",
    marginRight: 4,
    marginLeft: -2,
  },
  replyingToIconClickable: {
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
  },
}));

// Component for displaying the appropriate icon based on comment context
const CommentContextIcon = ({
  comment,
  post,
  isTopLevelComment,
  postInitiallyExpanded,
  parentAuthorName,
  onReplyIconClick,
  onPostTitleHighlight,
}: {
  comment: UltraFeedComment,
  post: PostsListWithVotes | null,
  isTopLevelComment: boolean,
  postInitiallyExpanded: boolean,
  parentAuthorName?: string | null,
  onReplyIconClick?: () => void,
  onPostTitleHighlight?: (iconType: 'shortform' | 'debate') => void,
}) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  
  const handleReplyIconClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    captureEvent("ultraFeedReplyArrowClicked");
    if (onReplyIconClick) {
      onReplyIconClick();
    }
  };

  const handlePostTitleHighlight = (event: React.MouseEvent, iconType: 'shortform' | 'debate') => {
    event.stopPropagation();
    captureEvent(iconType === 'shortform' ? "ultraFeedShortformIconClicked" : "ultraFeedDebateIconClicked");
    
    if (onPostTitleHighlight) {
      onPostTitleHighlight(iconType);
    }
  };

  if (!post) {
    return null;
  }

  // Show reply arrow for non-top-level comments or when post is initially expanded
  if (!isTopLevelComment || postInitiallyExpanded) {
    const isReplyingToPost = isTopLevelComment;
    const tooltip = isReplyingToPost
      ? `Replying to ${post.title}`
      : `Replying to ${parentAuthorName ?? 'parent comment'}`;
    
    return (
      <LWTooltip title={tooltip} placement="top">
        <SubdirectoryArrowLeft 
          className={classNames(classes.replyingToIcon, {
            [classes.replyingToIconClickable]: !!onReplyIconClick
          })}
          onClick={handleReplyIconClick}
        />
      </LWTooltip>
    );
  } else if (isTopLevelComment) {
    if (comment.shortform) {
      return (
        <LWTooltip title={post.title} placement="top">
          <div 
            className={classes.commentShortformIconContainer} 
            onClick={(event) => handlePostTitleHighlight(event, 'shortform')}
          >
            <ForumIcon icon="Shortform" className={classes.commentShortformIcon} />
          </div>
        </LWTooltip>
      );
    } else {
      return (
        <LWTooltip title={`Replying to ${post.title}`} placement="top">
          <div 
            className={classes.debateIconContainer} 
            onClick={(event) => handlePostTitleHighlight(event, 'debate')}
          >
            <DebateIcon className={classes.debateIcon} />
          </div>
        </LWTooltip>
      );
    }
  }
};

const ReplyingToTitle = ({comment, position, enabled, onPostTitleClick, highlighted}: {
  comment: UltraFeedComment,
  position: 'metarow' | 'above',
  enabled?: boolean,
  onPostTitleClick?: () => void,
  highlighted?: boolean,
}) => {
  const classes = useStyles(styles);
  const { post } = comment;

  const handleTitleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      if (onPostTitleClick) {
        event.preventDefault();
        onPostTitleClick();
      }
    }
  };

  if (!enabled || !post || post.shortform) {
    return null;
  }
  return (
    <div 
      className={classNames({
        [classes.sameRowPostTitle]: position === 'metarow',
        [classes.sameRowPostTitleHighlighted]: position === 'metarow' && highlighted,
        [classes.hideOnMobile]: position === 'metarow' || post.shortform,
        [classes.abovePostTitle]: position === 'above',
        [classes.abovePostTitleHighlighted]: position === 'above' && highlighted,
        [classes.hideOnDesktop]: position === 'above',
      })}
    >
      <PostsTooltip postId={post._id} placement="top" As="span">
        {position === 'above' && <span className={classes.postTitleReplyTo}>Replying to</span>}
          <a
            href={postGetPageUrl(post)}
            onClick={handleTitleClick}
            className={classes.postTitleLinkOrButtonSpan}
          >
            {post.title}
          </a>
      </PostsTooltip>
    </div>
  )
}

const UltraFeedCommentsItemMeta = ({
  comment,
  metaInfo,
  setShowEdit,
  hideDate,
  hideActionsMenu,
  showPostTitle,
  postInitiallyExpanded = false,
  onPostTitleClick,
  parentAuthorName,
  onReplyIconClick,
  onSeeLess,
  isSeeLessMode,
}: {
  comment: UltraFeedComment,
  metaInfo: FeedCommentMetaInfo, 
  setShowEdit?: () => void,
  hideDate?: boolean,
  hideActionsMenu?: boolean,
  showPostTitle?: boolean,
  postInitiallyExpanded?: boolean,
  onPostTitleClick?: () => void,
  parentAuthorName?: string | null,
  onReplyIconClick?: () => void,
  onSeeLess?: () => void,
  isSeeLessMode?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [postTitleHighlighted, setPostTitleHighlighted] = useState(false);
  const { post } = comment;
  const { feedType } = useUltraFeedContext();

  if (!post) {
    return null;
  }

  const moderatorCommentAnnotation = comment.hideModeratorHat ? "Moderator Comment (Invisible)" : "Moderator Comment";
  const showModeratorCommentAnnotation = comment.moderatorHat && (!comment.hideModeratorHat || userIsAdmin(currentUser));

  const isNewContent = comment.postedAt && (new Date(comment.postedAt) > new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)));
  const isTopLevelComment = !comment.parentCommentId;
  const isRead = !!metaInfo.lastViewed || !!metaInfo.lastInteracted;
  
  const isSubscribedFeed = feedType === 'following';
  const isFromSubscribedAuthor = !!metaInfo.fromSubscribedUser;
  
  const handlePostTitleHighlight = (iconType: 'shortform' | 'debate') => {
    setPostTitleHighlighted(true);
    // Remove highlight after a short delay
    setTimeout(() => {
      setPostTitleHighlighted(false);
    }, 100);
  };

  return (
    <div className={classes.root}>
      <div className={classes.tripleDotMenu}>
        {!hideActionsMenu && setShowEdit && post &&
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <CommentsMenu comment={comment} post={post} showEdit={setShowEdit} onSeeLess={onSeeLess} isSeeLessMode={isSeeLessMode} ActionsComponent={UltraFeedCommentActions} />
          </AnalyticsContext>
        }
      </div>
      <ReplyingToTitle enabled={showPostTitle} position="above" comment={comment} onPostTitleClick={onPostTitleClick} highlighted={postTitleHighlighted} />
      <div className={classes.metaRow}>
        <CommentContextIcon
          comment={comment}
          post={post}
          isTopLevelComment={isTopLevelComment}
          postInitiallyExpanded={postInitiallyExpanded}
          parentAuthorName={parentAuthorName}
          onReplyIconClick={onReplyIconClick}
          onPostTitleHighlight={handlePostTitleHighlight}
        />
        <UsersNameWithModal
          user={comment.user ?? undefined}
          className={classes.username}
          tooltipPlacement="bottom-start"
          showSubscribedIcon={isSubscribedFeed && isFromSubscribedAuthor}
        />
        {!hideDate && post && <span className={classNames({[classes.newContentDateStyling]: isNewContent})}>
          <CommentsItemDate comment={comment} post={post} className={classes.date}/>
        </span>}
        {post.shortform && isTopLevelComment && <UltraFeedMetaInfoPill type="quickTake" readStyles={isRead} />}
        {showModeratorCommentAnnotation &&
          <span className={classes.moderatorHat}>
            {moderatorCommentAnnotation}
          </span>
        }
        <ReplyingToTitle enabled={showPostTitle} position="metarow" comment={comment} onPostTitleClick={onPostTitleClick} highlighted={postTitleHighlighted} />
      </div>
    </div>
  );
};

export default UltraFeedCommentsItemMeta;


 
