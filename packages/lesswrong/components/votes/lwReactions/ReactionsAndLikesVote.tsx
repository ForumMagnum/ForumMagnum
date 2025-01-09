import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { CommentVotingComponentProps, NamesAttachedReactionsCommentBottomProps, VotingPropsDocument, VotingSystem, } from '../../../lib/voting/votingSystems';
import { useVote } from '../withVote';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { LikesList } from '@/lib/voting/reactionsAndLikes';
import { useCurrentUser } from '@/components/common/withUser';
import { isAdmin } from '@/lib/vulcan-users';
import classNames from 'classnames';

const styles = defineStyles("ReactionsAndLikesVote", (theme) => ({
  unselectedLikeButton: {
    cursor: "pointer",
    marginRight: 4,
    display: "flex",
    alignItems: "center",
    color: theme.palette.grey[900],
  },
  selectedLikeButton: {
    cursor: "pointer",
    marginRight: 4,
    display: "flex",
    alignItems: "center",
    color: theme.palette.grey[600],
  },
  icon: {
    width: 14,
    height: 14,
    verticalAlign: "middle",
    marginRight: 2,
    
    "$likeButton:hover &": {
      opacity: 0.7,
    },
  },
  likeCount: {
    verticalAlign: "middle",
    paddingBottom: 2,
  },
  likeCountButtonRow: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    verticalAlign: "middle",
    paddingBottom: 2,
    marginLeft: 2,
  },
}));

const ReactionsAndLikesVoteOnComment  = ({document, hideKarma=false, collectionName, votingSystem, isSelected=false}: {
  document: VotingPropsDocument,
  hideKarma?: boolean,
  collectionName: VoteableCollectionName,
  votingSystem: VotingSystem,
  isSelected?: boolean,
}) => {
  return <ReactionsAndLikesVote
    document={document} hideKarma={hideKarma}
    collectionName={collectionName} votingSystem={votingSystem}
    isSelected={isSelected}
  />
}

const ReactionsAndLikesVote  = ({
  document,
  hideKarma=false,
  collectionName,
  votingSystem,
  isSelected=false,
  stylingVariant="default",
  className,
}: CommentVotingComponentProps & {
  isSelected?: boolean,
  stylingVariant?: "default" | "buttonRow",
  className?: string,
}) => {
  const classes = useStyles(styles);
  const { LWTooltip, ForumIcon } = Components;
  const currentUser = useCurrentUser();

  const voteProps = useVote(document, collectionName, votingSystem);
  const usersWhoLiked: LikesList = voteProps.document?.extendedScore?.usersWhoLiked ?? [];
  const likeCount = usersWhoLiked.length;
  const baseScore = voteProps.document?.baseScore ?? 0;
  const currentUserLikesIt = voteProps.document.currentUserVote === "smallUpvote" || voteProps.document.currentUserVote === "bigUpvote";
  
  const toggleLike = async (ev: React.MouseEvent) => {
    ev.stopPropagation();

    if (!currentUser) {
      return; //TODO show login modal
    } else if (currentUserLikesIt) {
      await voteProps.vote({
        document: voteProps.document,
        voteType: "neutral",
        extendedVote: document?.currentUserExtendedVote,
        currentUser
      });
    } else {
      await voteProps.vote({
        document: voteProps.document,
        voteType: "bigUpvote",
        extendedVote: document?.currentUserExtendedVote,
        currentUser
      });
    }
  }

  const voteScoreTooltip = <div>
    {<div><strong>Click to {currentUserLikesIt ? "unlike" : "like"}</strong></div>}
    {usersWhoLiked.length > 0 && <div>Liked by: {usersWhoLiked.map(u => u.displayName).join(", ")}</div>}
    {isAdmin(currentUser) && <div>(admin visible only) baseScore: {baseScore}</div>}
  </div>
  
  const likeCountElement = stylingVariant === "buttonRow"
    ? <span className={classes.likeCountButtonRow}>{`(${likeCount})`}</span>
    : <span className={classes.likeCount}>{likeCount}</span>;
  

  return <div className={className}>
    <LWTooltip title={voteScoreTooltip}>
    <div className={classNames({[classes.unselectedLikeButton]: !isSelected, [classes.selectedLikeButton]: isSelected})} onClick={toggleLike} onMouseDown={(e) => e.stopPropagation()}>
      <ForumIcon icon={currentUserLikesIt ? "ThumbUp" : "ThumbUpOutline"} className={classes.icon} />
        {likeCount>0 && likeCountElement}
      </div>
    </LWTooltip>
  </div>
}

const ReactionsAndLikesCommentBottom = ({
  document, hideKarma=false, commentBodyRef, voteProps, post, collectionName, votingSystem
}: NamesAttachedReactionsCommentBottomProps) => {
  return <Components.NamesAttachedReactionsCommentBottom
    document={document} hideKarma={hideKarma} commentBodyRef={commentBodyRef}
    voteProps={voteProps} post={post}
    collectionName={collectionName} votingSystem={votingSystem}
  />
}

const ReactionsAndLikesVoteComponent = registerComponent('ReactionsAndLikesVote', ReactionsAndLikesVote);
const ReactionsAndLikesVoteOnCommentComponent = registerComponent('ReactionsAndLikesVoteOnComment', ReactionsAndLikesVoteOnComment);
const ReactionsAndLikesCommentBottomComponent = registerComponent('ReactionsAndLikesCommentBottom', ReactionsAndLikesCommentBottom);

declare global {
  interface ComponentTypes {
    ReactionsAndLikesVote: typeof ReactionsAndLikesVoteComponent
    ReactionsAndLikesVoteOnComment: typeof ReactionsAndLikesVoteOnCommentComponent
    ReactionsAndLikesCommentBottom: typeof ReactionsAndLikesCommentBottomComponent
  }
}

