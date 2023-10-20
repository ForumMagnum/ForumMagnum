import React, { ComponentPropsWithoutRef } from 'react';
import { NamesAttachedReactionsList, NamesAttachedReactionsScore } from '../../../lib/voting/namesAttachedReactions';
import { useCurrentUser } from '../../common/withUser';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useNamesAttachedReactionsVoting } from './NamesAttachedReactionsVoteOnComment';
import filter from 'lodash/filter';
import uniq from 'lodash/uniq';
import sumBy from 'lodash/sumBy';
import type { VotingProps } from '../votingProps';
import { ContentItemBody } from '../../common/ContentItemBody';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.commentStyle.fontFamily,
  },
  quote: {
    borderTop: theme.palette.border.faint,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 8,
    '&:hover': {
      background: theme.palette.panelBackground.darken04,
    }
  },
  tinyQuoteRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    '&:hover $tinyQuoteReactToggle': {
      opacity: 1,
      color: theme.palette.grey[900]
    }
  },
  tinyQuoteWrapper: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    maxWidth: 205,
  },
  tinyQuote: {
    textOverflow: "ellipsis", 
    marginBottom: 6,
    overflow: "hidden",
    maxHeight: "2em",
  },
  tinyQuoteReactToggle: {
    position: "relative",
    top: 2,
    padding: 6,
    cursor: "pointer",
    opacity: .2,
    fontWeight: 600,
    '&&:hover': {
      opacity: .5
    }
  },
  usersWhoQuoted: {
    fontSize: 12,
    color: theme.palette.grey[500]
  }
});

const ReactionQuotesHoverInfo = ({react, voteProps, commentBodyRef, classes}:{
  react: string, 
  voteProps: VotingProps<VoteableTypeClient>,
  commentBodyRef?: React.RefObject<ContentItemBody>|null,
  classes: ClassesType
}) => {
  const { ReactOrAntireactVote } = Components;
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;

  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
  const usersWhoReacted = alreadyUsedReactions[react]

  const allQuotesOrUndefined = uniq(usersWhoReacted?.flatMap(r => r.quotes))
  const allQuotes = filter(allQuotesOrUndefined, q => q !== undefined) as string[]
  
  const quotesWithUsers = allQuotes.map(quote => {
    const usersWhoReactedToQuote = usersWhoReacted?.filter(r => quote && r.quotes?.includes(quote))
    return { quote, users: usersWhoReactedToQuote  }
  })

  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

  function handleHoverQuote (quote: string) {
    // TODO
  }

  function handleLeaveQuote () {
    // TODO
  }

  if (!allQuotes.length) return null

  return <div className={classes.root}>
    {quotesWithUsers.map(({quote, users}) => {
      const netQuoteReactionCount = sumBy(users, (user) => user.reactType==="disagreed"?-1:1)
      
      // Pass in `setCurrentUserReaction` as a closure over the current `quote`, since `ReactOrAntireactVote` doesn't know anything about quotes
      type SetCurrentUserReactionPropType = ComponentPropsWithoutRef<typeof ReactOrAntireactVote>['setCurrentUserReaction'];
      const setCurrentUserQuoteReaction: SetCurrentUserReactionPropType = (reactionName, reaction) => setCurrentUserReaction(reactionName, reaction, quote);

      return <div key={quote} className={classes.quote}>
          <div className={classes.tinyQuoteRow} onMouseEnter={() => handleHoverQuote(quote)} onMouseLeave={() => handleLeaveQuote()}>
            <div className={classes.tinyQuoteWrapper}>
              <div className={classes.tinyQuote}>
                {quote.trim()}
              </div>
              <div className={classes.usersWhoQuoted}>
                {users?.map(user => user.displayName)?.join(", ")}
              </div>
            </div>
            <ReactOrAntireactVote
              reactionName={react}
              currentUserReaction={getCurrentUserReactionVote(react)}
              netReactionCount={netQuoteReactionCount}
              setCurrentUserReaction={setCurrentUserQuoteReaction}
            />
          </div>
        </div>
      })}
  </div>
} 


const ReactionQuotesHoverInfoComponent = registerComponent('ReactionQuotesHoverInfo', ReactionQuotesHoverInfo, {styles});

declare global {
  interface ComponentTypes {
    ReactionQuotesHoverInfo: typeof ReactionQuotesHoverInfoComponent
  }
}

