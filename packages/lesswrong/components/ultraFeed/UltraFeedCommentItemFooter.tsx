import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';
import { useVote } from "../votes/withVote";
import { getVotingSystemByName } from "@/lib/voting/votingSystems";
import { getNormalizedReactionsListFromVoteProps } from "@/lib/voting/namesAttachedReactions";

const styles = defineStyles("UltraFeedCommentItemFooter", (theme: ThemeType) => ({
  root: {
    position: "relative",
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    color: `${theme.palette.text.dim3} !important`,
    opacity: `1 !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "1.3rem !important",
    "& *": {
      color: `${theme.palette.text.dim3} !important`,
      // opacity: `1 !important`,
    },
    "& svg": {
      color: `${theme.palette.text.dim3} !important`,
      // opacity: `1 !important`,
      // fill: `${theme.palette.text.dim3} !important`,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  commentCount: {
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
  addReactionButton: {
    display: 'flex',
    margin: '0 6px',
    alignItems: 'center',
    '& .react-hover-style': {
      filter: 'opacity(1) !important',
    },
    '& svg': {
      filter: 'opacity(1) !important',
      height: 22,
      width: 22,
    }
  },
  reactionIcon: {
    marginRight: 6,
  },
  reactionCount: {
    marginTop: -2
  },
  bookmarkButton: {
    marginBottom: -2,
  }
}));


const UltraFeedCommentItemFooter = ({
  comment,
  post,
}: {
  comment: CommentsList,
  post: PostsListWithVotes,
}) => {
  const classes = useStyles(styles);

  const { SmallSideVote, BookmarkButton, OverallVoteAxis, AgreementVoteAxis, ForumIcon, AddReactionButton } = Components;


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


  const votingSystem = getVotingSystemByName(post.votingSystem || "default");
  const showVoteButtons = votingSystem.name === "namesAttachedReactions";
  const voteProps = useVote(comment, "Comments", votingSystem);

  const reacts = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactionCount = reacts ? Object.keys(reacts).length : 0;






  return <div className={classes.root}>
    {commentCountIcon}
    
    {showVoteButtons && <><OverallVoteAxis
      document={comment}
      hideKarma={post?.hideCommentKarma}
      voteProps={voteProps}
      verticalArrows
      largeArrows
    />
      <AgreementVoteAxis
        document={comment}
        hideKarma={post?.hideCommentKarma}
        voteProps={voteProps}
      />
    </>}

    <div className={classes.addReactionButton}>
      <div className={classes.reactionIcon}>
        <AddReactionButton voteProps={voteProps} document={comment} />
      </div>
      <div className={classes.reactionCount}>
        {reactionCount > 0 && reactionCount}
      </div>
    </div>

    <div className={classes.bookmarkButton}>
      <BookmarkButton post={post} />
    </div>

  </div>;
};

const UltraFeedCommentItemFooterComponent = registerComponent("UltraFeedCommentItemFooter", UltraFeedCommentItemFooter);

export default UltraFeedCommentItemFooterComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCommentItemFooter: typeof UltraFeedCommentItemFooterComponent
  }
} 

