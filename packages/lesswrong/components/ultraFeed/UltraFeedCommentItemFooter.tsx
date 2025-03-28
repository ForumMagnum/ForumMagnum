import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';

const styles = defineStyles("UltraFeedCommentItemFooter", (theme: ThemeType) => ({
  root: {
    position: "relative",
    padding: 8,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    color: `${theme.palette.text.dim3} !important`,
    opacity: `1 !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "1.3rem !important",
    // "& > *": {
    //   marginRight: 5,
    // },
    // "& a:hover, & a:active": {
    //   textDecoration: "none",
    //   color: `${theme.palette.linkHover.dim} !important`,
    // },
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    // gap: "12px"
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
  },
  commentCount: {
    // marginRight: 20,
    // color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    "& svg": {
      height: 22,
    },
  },
  commentCountClickable: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  commentCountText: {
    marginLeft: 4,
  },
  voteButtons: {
    marginLeft: 2,
    paddingTop: 2
  },
}));


const UltraFeedCommentItemFooter = ({
  comment,
  post,
}: {
  comment: CommentsList,
  post: PostsListWithVotes,
}) => {
  const classes = useStyles(styles);

  const { SmallSideVote, BookmarkButton, ForumIcon } = Components;


  const commentCount = comment.descendentCount;
  const commentsAreClickable = true;

  // TODO: Implement this
  const onClickComments = () => {
    console.log("clicked comments");
  };

  const commentCountIcon = (
    <div
      onClick={onClickComments}
      className={classNames(classes.commentCount, {
        [classes.commentCountClickable]: commentsAreClickable,
      })}
    >
      {/* <ForumIcon icon="Comment" /> */}
      <CommentIcon />
      <span className={classes.commentCountText}>
        {commentCount}
      </span>
    </div>
  );

  return (
    <div className={classes.root}>
      {/* <span className={classes.leftSection}> */}
        {commentCountIcon}
        <div className={classes.voteButtons}>
          <SmallSideVote
            document={comment}
            collectionName="Comments"
            hideKarma={post?.hideCommentKarma}
          />
        </div>
      {/* </span> */}
      {/* <span className={classes.rightSection}> */}
        <BookmarkButton post={post} />
      {/* </span> */}
    </div>
  );
};

const UltraFeedCommentItemFooterComponent = registerComponent("UltraFeedCommentItemFooter", UltraFeedCommentItemFooter);

export default UltraFeedCommentItemFooterComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCommentItemFooter: typeof UltraFeedCommentItemFooterComponent
  }
} 
