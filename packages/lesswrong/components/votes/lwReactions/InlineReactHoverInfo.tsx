import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import type { NamesAttachedReactionsList, QuoteLocator } from '../../../lib/voting/namesAttachedReactions';
import type { VotingProps } from '../votingProps';
import Card from '@material-ui/core/Card';

const styles = (theme: ThemeType) => ({
})

/**
 * The hover that's shown when you hover over a passage which has an inline
 * reaction to it (not to be confused with the hover that appears when you
 * hover over a reaction in the comment footer). Note that there may be
 * multiple different types of reactions here, if different users reacted
 * differently.
 */
const InlineReactHoverInfo = ({quote, reactions, voteProps, classes}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const { ReactionHoverTopRow, ReactionQuotesHoverInfo } = Components;
  const reactionNames = Object.keys(reactions);

  return <Card>
    {reactionNames.map(reactionName => <div key={reactionName}>
      <ReactionHoverTopRow
        reactionName={reactionName}
        userReactions={reactions[reactionName] ?? []}
        showNonInlineVoteButtons={false}
        voteProps={voteProps}
      />
      <ReactionQuotesHoverInfo
        react={reactionName}
        quote={quote}
        voteProps={voteProps}
      />
    </div>)}
  </Card>
}

const InlineReactHoverInfoComponent = registerComponent('InlineReactHoverInfo', InlineReactHoverInfo, {styles});

declare global {
  interface ComponentTypes {
    InlineReactHoverInfo: typeof InlineReactHoverInfoComponent
  }
}

