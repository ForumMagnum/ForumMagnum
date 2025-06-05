import React from "react";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import CommentsMenu from "../dropdowns/comments/CommentsMenu";
import CommentsItemDate from "../comments/CommentsItem/CommentsItemDate";
import CommentUserName from "../comments/CommentsItem/CommentUserName";
import CommentShortformIcon from "../comments/CommentsItem/CommentShortformIcon";
import UltraFeedCommentActions from "./UltraFeedCommentActions";
import SubdirectoryArrowLeft from "@/lib/vendor/@material-ui/icons/src/SubdirectoryArrowLeft";
import LWTooltip from "../common/LWTooltip";

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
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  tripleDotMenu: {
    opacity: 0.7,
    position: 'absolute',
    right: -10,
    top: 4,

    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
      right: 0,
    },
  },
  commentShortformIconContainer: {
    position: 'relative',
    bottom: 0,
  },
  commentShortformIcon: {
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      bottom: 10
    },
  },
  username: {
    marginRight: 8,
    textWrap: "nowrap",
    '& a, & a:hover': {
      color: theme.palette.link.unmarked,
    },
    fontWeight: 600,
  },
  moderatorHat: {
    marginLeft: 10,
  },
  newContentDateStyling: {
  },
  date: {
    marginRight: 24,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.ultraFeedMobileStyle,
    },
  },
  sameRowPostTitle: {
    maxWidth: '70%',
    position: 'relative',
    marginLeft: 'auto',
    marginRight: 16,
    cursor: 'pointer',
    overflow: "hidden",
    wordBreak: 'break-all',
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
  },
  belowPostTitle: {
    marginTop: 8,
    marginRight: 12,
    color: theme.palette.link.dim,
    fontSize: theme.typography.body2.fontSize,
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
  },
  replyingToIconClickable: {
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
  },
}));

const ReplyingToTitle = ({comment, position, enabled, onPostTitleClick}: {
  comment: UltraFeedComment,
  position: 'metarow' | 'below',
  enabled?: boolean,
  onPostTitleClick?: () => void,
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

  if (!enabled || !post ) {
    return null;
  }
  return (
    <div 
      className={classNames({
        [classes.sameRowPostTitle]: position === 'metarow',
        [classes.hideOnMobile]: position === 'metarow' && !post.shortform,
        [classes.belowPostTitle]: position === 'below',
        [classes.hideOnDesktop]: position === 'below',
      })}
    >
      <PostsTooltip postId={post._id} placement="top" As="span">
        {position === 'below' && <span className={classes.postTitleReplyTo}>Replying to</span>}
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
  setShowEdit,
  hideDate,
  hideActionsMenu,
  showPostTitle,
  onPostTitleClick,
  parentAuthorName,
  onReplyIconClick,
}: {
  comment: UltraFeedComment,
  setShowEdit?: () => void,
  hideDate?: boolean,
  hideActionsMenu?: boolean,
  showPostTitle?: boolean,
  onPostTitleClick?: () => void,
  parentAuthorName?: string | null,
  onReplyIconClick?: () => void,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { post } = comment;

  if (!post) {
    return null;
  }

  const moderatorCommentAnnotation = comment.hideModeratorHat
    ? "Moderator Comment (Invisible)"
    : "Moderator Comment";

  const showModeratorCommentAnnotation = comment.moderatorHat && (
    userIsAdmin(currentUser)
      ? true
      : !comment.hideModeratorHat
  );

  const isNewContent = comment.postedAt && (new Date(comment.postedAt) > new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)));
  const isTopLevelComment = !comment.parentCommentId;

  const handleReplyIconClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onReplyIconClick) {
      onReplyIconClick();
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.tripleDotMenu}>
        {!hideActionsMenu && setShowEdit && post &&
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <CommentsMenu comment={comment} post={post} showEdit={setShowEdit} ActionsComponent={UltraFeedCommentActions} />
          </AnalyticsContext>
        }
      </div>
      <div className={classes.metaRow}>
        {!isTopLevelComment && (
          <LWTooltip 
            title={parentAuthorName ? `Replying to ${parentAuthorName}` : "Replying to parent comment"}
            placement="top"
          >
            <SubdirectoryArrowLeft 
              className={classNames(classes.replyingToIcon, {
                [classes.replyingToIconClickable]: !!onReplyIconClick
              })}
              onClick={handleReplyIconClick}
            />
          </LWTooltip>
        )}
        {comment.shortform && post && <div className={classes.commentShortformIconContainer}>
          <CommentShortformIcon comment={comment} post={post} iconClassName={classes.commentShortformIcon}/>
        </div>}
        <CommentUserName
          comment={comment}
          className={classes.username}
        />
        {!hideDate && post && <span className={classNames({[classes.newContentDateStyling]: isNewContent})}>
          <CommentsItemDate comment={comment} post={post} className={classes.date}/>
        </span>}
        {showModeratorCommentAnnotation &&
          <span className={classes.moderatorHat}>
            {moderatorCommentAnnotation}
          </span>
        }
        <ReplyingToTitle enabled={showPostTitle} position="metarow" comment={comment} onPostTitleClick={onPostTitleClick} />
      </div>
      <ReplyingToTitle enabled={showPostTitle && !post?.shortform} position="below" comment={comment} onPostTitleClick={onPostTitleClick} />
    </div>
  );
};

export default UltraFeedCommentsItemMeta;


 
