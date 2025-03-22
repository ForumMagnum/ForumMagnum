import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { DisplayFeedComment } from "./ultraFeedTypes";
import { commentGetKarma } from "@/lib/collections/comments/helpers";

const styles = defineStyles("UltraFeedCommentsItemMeta", (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    
    alignItems: "center",
    rowGap: "6px",
    // marginBottom: 8,
    color: theme.palette.text.dim,
    paddingTop: "0.6em",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "1.4rem !important",
    "& > *": {
      marginRight: 5,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
    flexWrap: "wrap",
  },
  karma: {
    display:"inline-block",
    textAlign: "center",
    flexGrow: 0,
    flexShrink: 0,
    // paddingTop: 5,
    paddingRight: 8,
  },
  username: {
    marginRight: 8,
    textWrap: "nowrap",
    '& a, & a:hover': {
      color: theme.palette.link.unmarked,
    },
    fontWeight: 600,
  },
  rightSection: {
    display: "flex",
    flexGrow: 0,
  },
  menu: {
    marginLeft: 4,
    marginRight: -10
  },
  moderatorHat: {
    marginLeft: 10,
  },
  voteButtons: {
    marginLeft: 2,
    paddingTop: 2
  },
}));

const UltraFeedCommentsItemMeta = ({
  commentWithMetaInfo,
  post,
  setShowEdit,
  hideDate,
  hideActionsMenu,
  hideVoteButtons,
}: {
  commentWithMetaInfo: DisplayFeedComment,
  post: PostsMinimumInfo,
  setShowEdit?: () => void,
  hideDate?: boolean,
  hideVoteButtons?: boolean,
  hideActionsMenu: boolean,
}) => {
  const classes = useStyles(styles);
  const { CommentsMenu, CommentsItemDate, CommentUserName, SmallSideVote } = Components;

  const { comment, metaInfo } = commentWithMetaInfo;

  const currentUser = useCurrentUser();

  const moderatorCommentAnnotation = comment.hideModeratorHat
    ? "Moderator Comment (Invisible)"
    : "Moderator Comment";

  const showModeratorCommentAnnotation = comment.moderatorHat && (
    userIsAdmin(currentUser)
      ? true
      : !comment.hideModeratorHat
  );


  const showKarma = hideVoteButtons && !comment.rejected && !comment.debateResponse;
  const showVoteButtons = !hideVoteButtons && !comment.rejected && !comment.debateResponse;

  return (
    <div className={classes.root}>
      <span className={classes.leftSection}>
        {showKarma && <span className={classes.karma}>
          {commentGetKarma(comment)}
        </span>}
        <CommentUserName
          comment={comment}
          className={classes.username}
        />
        {!hideDate && <CommentsItemDate comment={comment} post={post} />}
        {showVoteButtons && <div className={classes.voteButtons}>
          <SmallSideVote
            document={comment}
            collectionName="Comments"
            hideKarma={post?.hideCommentKarma}
          />
        </div>}
        {showModeratorCommentAnnotation &&
          <span className={classes.moderatorHat}>
            {moderatorCommentAnnotation}
          </span>
        }
      </span>

      <span className={classes.rightSection}>
        {!hideActionsMenu && setShowEdit &&
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <CommentsMenu
              className={classes.menu}
              comment={comment}
              post={post}
              showEdit={setShowEdit}
            />
          </AnalyticsContext>
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
