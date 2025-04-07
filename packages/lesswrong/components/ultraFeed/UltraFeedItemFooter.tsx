import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';
import { useVote } from "../votes/withVote";
import { getVotingSystemByName } from "@/lib/voting/votingSystems";
import { getNormalizedReactionsListFromVoteProps } from "@/lib/voting/namesAttachedReactions";

const styles = defineStyles("UltraFeedItemFooter", (theme: ThemeType) => ({
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
    },
    "& svg": {
      color: `${theme.palette.text.dim3} !important`,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  commentCount: {
    display: "flex",
    alignItems: "center",
    paddingBottom: 2,
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
  addReactionButtonPlaceholder: {
    width: 28,
  },
  bookmarkButton: {
    marginBottom: -2,
  }
}));

type DocumentType = PostsListWithVotes | CommentsList;

interface UltraFeedItemFooterProps {
  document: DocumentType;
  collectionName: "Posts" | "Comments"; // Now required, no longer optional
}

const UltraFeedItemFooter = ({
  document,
  collectionName,
}: UltraFeedItemFooterProps) => {
  const classes = useStyles(styles);
  const { BookmarkButton, OverallVoteAxis, AgreementVoteAxis, AddReactionButton } = Components;

  const isComment = collectionName === "Comments";
  
  const parentPost = isComment ? (document as UltraFeedComment).post : undefined;
  
  const commentCount = isComment 
    ? (document as CommentsList).descendentCount || 0 
    : (document as PostsListWithVotes).commentCount || 0;
    
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
      <CommentIcon />
      <span className={classes.commentCountText}>
        {commentCount}
      </span>
    </div>
  );

  // Determine the voting system based on the actual document type
  const votingSystemName = isComment ? parentPost?.votingSystem : (document as PostsListWithVotes)?.votingSystem;
  const votingSystem = getVotingSystemByName(votingSystemName || "default");

  // Show vote buttons only if the voting system matches and it's not a comment with hidden karma (or adjust logic as needed)
  const showVoteButtons = votingSystem.name === "namesAttachedReactions" && !(isComment && parentPost?.hideCommentKarma);
  
  const voteProps = useVote(document, collectionName, votingSystem);

  const reacts = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactionCount = reacts ? Object.keys(reacts).length : 0;

  return (
    <div className={classes.root}>
      {commentCountIcon}
      
      {showVoteButtons && (
        <>
          <OverallVoteAxis
            document={document}
            hideKarma={isComment && parentPost?.hideCommentKarma}
            voteProps={voteProps}
            verticalArrows
            largeArrows
            size="large"
            hideAfScore={true}
          />
          <AgreementVoteAxis
            document={document}
            hideKarma={isComment && parentPost?.hideCommentKarma}
            voteProps={voteProps}
            size="large"
          />
        </>
      )}

      <div className={classes.addReactionButton}>
        <div className={classes.reactionIcon}>
          <AddReactionButton voteProps={voteProps} />
        </div>
        <div className={classes.reactionCount}>
          {reactionCount > 0 && reactionCount}
        </div>
      </div>
      
      {((collectionName === "Comments" && parentPost) || (collectionName === "Posts")) && (
        <div className={classes.bookmarkButton}>
          {/* TODO: make this work by making bookmarks */}
          <BookmarkButton post={parentPost ?? document as PostsListWithVotes} />
        </div>
      )}
    </div>
  );
};

const UltraFeedItemFooterComponent = registerComponent("UltraFeedItemFooter", UltraFeedItemFooter);

export default UltraFeedItemFooterComponent;

declare global {
  interface ComponentTypes {
    UltraFeedItemFooter: typeof UltraFeedItemFooterComponent
  }
} 