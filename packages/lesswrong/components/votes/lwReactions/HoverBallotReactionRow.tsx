import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import type { EmojiReactName, QuoteLocator, UserReactInfo } from '../../../lib/voting/namesAttachedReactions';
import type { ContentItemBody } from '../../common/ContentItemBody';
import type { VotingProps } from '../votingProps';
import sumBy from 'lodash/sumBy';
import { getNamesAttachedReactionsByName } from '../../../lib/voting/reactions';
import { useNamesAttachedReactionsVoting } from './NamesAttachedReactionsVoteOnComment';

const styles = (theme: ThemeType): JssStyles => ({
  hoverBallotEntry: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    cursor: "pointer",
    paddingTop: 16,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 8,
    "&:hover": {
      background: theme.palette.panelBackground.darken04,
    },
    
    display: "flex",
    alignItems: "flex-start",
  },
  hoverInfo: {
    paddingLeft: 10,
    maxWidth: 195,
    flexGrow: 1,
  },
  hoverBallotLabel: {
    verticalAlign: "middle",
    display: "inline-block",
    minWidth: 80,
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

const HoverBallotReactionRow = ({reactionName, quote, usersWhoReacted, classes, commentBodyRef, voteProps}: {
  reactionName: EmojiReactName,
  quote: QuoteLocator|null,
  usersWhoReacted: UserReactInfo[],
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  commentBodyRef?: React.RefObject<ContentItemBody>|null
}) => {
  const { ReactionDescription, ReactionIcon, ReactionQuotesHoverInfo } = Components;
  const netReactionCount = sumBy(usersWhoReacted, r=>r.reactType==="disagreed"?-1:1);
  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

  // Don't show the "general" (non-quote-specific) ballot for this react if all the instances of this react are inline (quote-specific)
  const allReactsAreInline = usersWhoReacted.every(userWhoReacted => userWhoReacted.quotes?.length);

  return <div key={reactionName}>
    <div className={classes.hoverBallotEntry}>
      <ReactionIcon react={reactionName} size={30}/>
      <div className={classes.hoverInfo}>
        <span className={classes.hoverBallotLabel}>
          {getNamesAttachedReactionsByName(reactionName).label}
        </span>
        
        <ReactionDescription
          reaction={getNamesAttachedReactionsByName(reactionName)}
          className={classes.hoverBallotReactDescription}
        />
        <Components.UsersWhoReacted usersWhoReacted={usersWhoReacted} wrap showTooltip={false}/>
      </div>
      {!allReactsAreInline && <Components.ReactOrAntireactVote
        reactionName={reactionName}
        quote={quote}
        netReactionCount={netReactionCount}
        currentUserReaction={getCurrentUserReactionVote(reactionName, quote)}
        setCurrentUserReaction={setCurrentUserReaction}
      />}
    </div>
    <ReactionQuotesHoverInfo
      react={reactionName} quote={quote}
      voteProps={voteProps}
      commentBodyRef={commentBodyRef}
    />
  </div>
}


const HoverBallotReactionRowComponent = registerComponent('HoverBallotReactionRow', HoverBallotReactionRow, {styles});

declare global {
  interface ComponentTypes {
    HoverBallotReactionRow: typeof HoverBallotReactionRowComponent
  }
}

