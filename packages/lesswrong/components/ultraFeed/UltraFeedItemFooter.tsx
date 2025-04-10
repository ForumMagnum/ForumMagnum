import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import CommentIcon from '@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined';
import { useVote } from "../votes/withVote";
import { VotingProps } from "../votes/votingProps";
import { getNormalizedReactionsListFromVoteProps } from "@/lib/voting/namesAttachedReactions";
import { getVotingSystemByName } from "@/lib/voting/getVotingSystem";

const styles = defineStyles("UltraFeedItemFooter", (theme: ThemeType) => ({
  root: {
    position: "relative",
    paddingLeft: 8,
    paddingRight: 8,
    // paddingTop: 8,
    // paddingBottom: 8,
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

interface UltraFeedItemFooterCoreProps {
  commentCount: number;
  onClickComments: () => void;
  showVoteButtons: boolean;
  voteProps: VotingProps<VoteableTypeClient>;
  hideKarma?: boolean;
  reactionCount: number;
  bookmarkDocument?: PostsMinimumInfo;
  className?: string;
}

const UltraFeedItemFooterCore = ({
  commentCount,
  onClickComments,
  showVoteButtons,
  voteProps,
  hideKarma,
  reactionCount,
  bookmarkDocument,
  className,
}: UltraFeedItemFooterCoreProps) => {
  const classes = useStyles(styles);
  const { BookmarkButton, OverallVoteAxis, AgreementVoteAxis, AddReactionButton } = Components;

  const commentCountIcon = (
    <div
      onClick={onClickComments}
      className={classNames(classes.commentCount, {
        [classes.commentCountClickable]: false // TODO: Implement this
      })}
    >
      <CommentIcon />
      <span className={classes.commentCountText}>
        {commentCount}
      </span>
    </div>
  );

  return (
    <div className={classNames(classes.root, className)}>
      {commentCountIcon}

      {showVoteButtons && voteProps.document && (
        <>
          <OverallVoteAxis
            document={voteProps.document}
            hideKarma={hideKarma}
            voteProps={voteProps}
            verticalArrows
            largeArrows
            size="large"
            hideAfScore={true}
          />
          <AgreementVoteAxis
            document={voteProps.document}
            hideKarma={hideKarma}
            voteProps={voteProps}
            size="large"
          />
        </>
      )}

      {voteProps.document && (
        <div className={classes.addReactionButton}>
          <div className={classes.reactionIcon}>
            <AddReactionButton voteProps={voteProps} />
          </div>
          <div className={classes.reactionCount}>
            {reactionCount > 0 && reactionCount}
          </div>
        </div>
      )}
      
      { bookmarkDocument && (
        <div className={classes.bookmarkButton}>
          <BookmarkButton post={bookmarkDocument} />
        </div>
      )}
    </div>
  );
};


const UltraFeedPostFooter = ({ post, className }: { post: PostsListWithVotes, className?: string }) => {
  const votingSystem = getVotingSystemByName(post?.votingSystem || "default");
  const voteProps = useVote(post, "Posts", votingSystem);
  const reacts = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactionCount = reacts ? Object.keys(reacts).length : 0;
  const showVoteButtons = votingSystem.name === "namesAttachedReactions";
  const commentCount = post.commentCount ?? 0;
  const onClickComments = () => {};

  return (
    <UltraFeedItemFooterCore
      commentCount={commentCount}
      onClickComments={onClickComments}
      showVoteButtons={showVoteButtons}
      voteProps={voteProps}
      hideKarma={false}
      reactionCount={reactionCount}
      bookmarkDocument={post}
      className={className}
    />
  );
}


const UltraFeedCommentFooter = ({ comment, className }: { comment: UltraFeedComment, className?: string }) => {
  const parentPost = comment.post;
  const votingSystem = getVotingSystemByName(parentPost?.votingSystem || "default");
  const voteProps = useVote(comment, "Comments", votingSystem);
  const reacts = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts;
  const reactionCount = reacts ? Object.keys(reacts).length : 0;
  const hideKarma = !!parentPost?.hideCommentKarma;
  const showVoteButtons = votingSystem.name === "namesAttachedReactions" && !hideKarma;
  const commentCount = comment.descendentCount ?? 0;
  const onClickComments = () => {};

  const bookmarkDocument = parentPost;

  return (
    <UltraFeedItemFooterCore
      commentCount={commentCount}
      onClickComments={onClickComments}
      showVoteButtons={showVoteButtons}
      voteProps={voteProps}
      hideKarma={hideKarma}
      reactionCount={reactionCount}
      bookmarkDocument={bookmarkDocument ?? undefined}
      className={className}
    />
  );
}


interface UltraFeedItemFooterProps {
  document: PostsListWithVotes | UltraFeedComment;
  collectionName: "Posts" | "Comments";
  className?: string;
}

const UltraFeedItemFooter = ({ document, collectionName, className }: UltraFeedItemFooterProps) => {
  if (collectionName === "Posts") {
    return <UltraFeedPostFooter post={document as PostsListWithVotes} className={className} />;
  } else if (collectionName === "Comments") {
    return <UltraFeedCommentFooter comment={document as UltraFeedComment} className={className} />;
  }
  return null;
};


const UltraFeedItemFooterComponent = registerComponent("UltraFeedItemFooter", UltraFeedItemFooter);

export default UltraFeedItemFooterComponent; 

declare global {
  interface ComponentTypes {
    UltraFeedItemFooter: typeof UltraFeedItemFooterComponent
  }
} 
