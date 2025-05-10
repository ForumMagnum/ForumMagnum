import React from 'react';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import type { EmojiReactName, UserReactInfo } from '../../../lib/voting/namesAttachedReactions';
import { VotingProps } from '../votingProps';
import { getNamesAttachedReactionsByName } from '../../../lib/voting/reactions';
import { useNamesAttachedReactionsVoting } from './NamesAttachedReactionsVoteOnComment';
import filter from 'lodash/filter';
import sumBy from 'lodash/sumBy';
import { UsersWhoReacted } from "./UsersWhoReacted";
import { ReactOrAntireactVote } from "./ReactOrAntireactVote";
import { ReactionDescription } from "./ReactionDescription";
import { ReactionIcon } from "../ReactionIcon";

const styles = (theme: ThemeType) => ({
  hoverBallotEntry: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    cursor: "pointer",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 8,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
    
    display: "flex",
    alignItems: "center",
    borderRadius: 4,
  },
  hoverInfo: {
    paddingLeft: 10,
    maxWidth: 195,
    flexGrow: 1,
  },
  hoverBallotLabel: {
    verticalAlign: "middle",
    display: "inline-block",
    minWidth: 70,
    marginRight: 10,
    marginBottom: 4
  },
  hoverBallotReactDescription: {
    fontSize: 11,
    marginBottom: 8,
    '& em': {
      display: "none"
    }
  },
})

const ReactionHoverTopRowInner = ({reactionName, userReactions, showNonInlineVoteButtons, voteProps, classes}: {
  reactionName: EmojiReactName
  userReactions: UserReactInfo[],
  showNonInlineVoteButtons: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const nonInlineReactions = filter(userReactions, r => !(r.quotes?.length));
  const nonInlineNetReactionCount = sumBy(nonInlineReactions, r => r.reactType==="disagreed"?-1:1);
  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

  return <div className={classes.hoverBallotEntry}>
    <ReactionIcon react={reactionName} size={30}/>
    <div className={classes.hoverInfo}>
      <span className={classes.hoverBallotLabel}>
        {getNamesAttachedReactionsByName(reactionName).label}
      </span>
      
      <ReactionDescription
        reaction={getNamesAttachedReactionsByName(reactionName)}
        className={classes.hoverBallotReactDescription}
      />
      <UsersWhoReacted reactions={nonInlineReactions} wrap showTooltip={false}/>
    </div>
    {showNonInlineVoteButtons && <ReactOrAntireactVote
      reactionName={reactionName}
      quote={null}
      netReactionCount={nonInlineNetReactionCount}
      currentUserReaction={getCurrentUserReactionVote(reactionName, null)}
      setCurrentUserReaction={setCurrentUserReaction}
    />}
  </div>
}

export const ReactionHoverTopRow = registerComponent('ReactionHoverTopRow', ReactionHoverTopRowInner, {styles});



