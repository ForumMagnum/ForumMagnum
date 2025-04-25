import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";

const styles = defineStyles("UltraFeedCommentsItemMeta", (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    
    alignItems: "center",
    color: `${theme.palette.ultraFeed.dim} !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.ultraFeedMobileStyle.fontSize,
    },
    "& > *": {
      marginRight: 5,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  tripleDotMenu: {
    position: 'absolute',
    right: -12,
    top: 0,
    display: "flex",
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
    },
  },
  leftSection: {
    display: "flex",
    alignItems: "baseline",
    flexGrow: 1,
    flexWrap: "wrap",
  },
  commentShortformIconContainer: {
    position: 'relative',
    bottom: 1,
    marginRight: 2,
  },
  commentShortformIcon: {
    position: 'relative',
    // [theme.breakpoints.up('md')]: {
    //   color: theme.palette.ultraFeed.dim,
    //   cursor: "pointer",
    //   height: 16,
    //   marginRight: 4,
    //   width: 16,
    //   marginLeft: -2,
    // },
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
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.ultraFeedMobileStyle,
    },
  },
}));

const UltraFeedCommentsItemMeta = ({
  comment,
  setShowEdit,
  hideDate,
  hideActionsMenu,
}: {
  comment: UltraFeedComment,
  setShowEdit?: () => void,
  hideDate?: boolean,
  hideActionsMenu?: boolean,
}) => {
  const classes = useStyles(styles);
  const { CommentsMenu, CommentsItemDate, CommentUserName, CommentShortformIcon } = Components;

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

  return (
    <div className={classes.root}>
      {/* absolutely positioned triple dot menu to ensure matching other item components */}
      <span className={classes.tripleDotMenu}>
        {!hideActionsMenu && setShowEdit &&
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <CommentsMenu comment={comment} post={post} showEdit={setShowEdit} />
          </AnalyticsContext>
        }
      </span>
      <span className={classes.leftSection}>
        {comment.shortform && <div className={classes.commentShortformIconContainer}>
          <CommentShortformIcon comment={comment} post={post} iconClassName={classes.commentShortformIcon}/>
        </div>}
        <CommentUserName
          comment={comment}
          className={classes.username}
        />
        {!hideDate && <span className={classNames({[classes.newContentDateStyling]: isNewContent})}>
          <CommentsItemDate comment={comment} post={post} className={classes.date}/>
        </span>}
        {showModeratorCommentAnnotation &&
          <span className={classes.moderatorHat}>
            {moderatorCommentAnnotation}
          </span>
        }
      </span>

    </div>
  );
};

const UltraFeedCommentsItemMetaComponent = registerComponent(
  "UltraFeedCommentsItemMeta",
  UltraFeedCommentsItemMeta
);

export default UltraFeedCommentsItemMetaComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCommentsItemMeta: typeof UltraFeedCommentsItemMetaComponent
  }
} 
