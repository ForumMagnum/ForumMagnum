import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { CommentVotingComponentProps, NamesAttachedReactionsCommentBottomProps, VotingPropsDocument, VotingSystem, } from '../../../lib/voting/votingSystems';
import { useVote } from '../withVote';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { LikesList } from '@/lib/voting/reactionsAndLikes';
import { useCurrentUser } from '@/components/common/withUser';
import { isAdmin } from '@/lib/vulcan-users';

const styles = defineStyles("ReactionsAndLikesVote", (theme) => ({
  likeButton: {
    cursor: "pointer",
  },
  icon: {
    width: 16,
    height: 16,
    opacity: 0.5,
    verticalAlign: "middle",
    
    "$likeButton:hover &": {
      opacity: 1,
    },
  },
  likeCount: {
    verticalAlign: "middle",
  },
}));

const ReactionsAndLikesVoteOnComment  = ({document, hideKarma=false, collectionName, votingSystem}: {
  document: VotingPropsDocument,
  hideKarma?: boolean,
  collectionName: VoteableCollectionName,
  votingSystem: VotingSystem,
}) => {
  return <ReactionsAndLikesVote
    document={document} hideKarma={hideKarma}
    collectionName={collectionName} votingSystem={votingSystem}
  />
}

const ReactionsAndLikesVote  = ({document, hideKarma=false, collectionName, votingSystem}: CommentVotingComponentProps) => {
  const classes = useStyles(styles);
  const { LWTooltip } = Components;
  const currentUser = useCurrentUser();

  const voteProps = useVote(document, collectionName, votingSystem);
  const usersWhoLiked: LikesList = voteProps.document?.extendedScore?.usersWhoLiked ?? [];
  const likeCount = usersWhoLiked.length;
  const baseScore = voteProps.document?.baseScore ?? 0;
  const currentUserLikesIt = voteProps.document.currentUserVote === "smallUpvote" || voteProps.document.currentUserVote === "bigUpvote";
  
  const toggleLike = async (ev: React.MouseEvent) => {
    ev.stopPropagation();

    if (!currentUser) {
      return; //TODO
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
        voteType: "smallUpvote",
        extendedVote: document?.currentUserExtendedVote,
        currentUser
      });
    }
  }

  const voteScoreTooltip = `${usersWhoLiked.map(u => u.displayName).join(", ")}
  ${isAdmin(currentUser) ? `\n(admin visible only) baseScore: ${baseScore}` : ""}
`

  return <LWTooltip title={voteScoreTooltip}>
    <div className={classes.likeButton} onClick={toggleLike} onMouseDown={(e) => e.stopPropagation()}>
      <img className={classes.icon} src="/reactionImages/nounproject/noun-thumbs-up-1686284.svg"/>
      {likeCount>0 && <span className={classes.likeCount}>{likeCount}</span>}
    </div>
  </LWTooltip>
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

