import React from 'react';
import { NamesAttachedReactionsList, NamesAttachedReactionsScore } from '../../../lib/voting/namesAttachedReactions';
import { useCurrentUser } from '../../common/withUser';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { clearHighlights, markHighlights, useNamesAttachedReactionsVoting } from './NamesAttachedReactionsVoteOnComment';
import { VotingProps } from '../withVote';
import filter from 'lodash/filter';
import uniq from 'lodash/uniq';
import { dimHighlightClassName, highlightSelectorClassName } from '../../comments/CommentsItem/CommentsItem';

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

const ReactionQuotes = ({react, voteProps, commentItemRef, classes}:{
  react: string, 
  voteProps: VotingProps<VoteableTypeClient>,
  commentItemRef?: React.RefObject<HTMLDivElement>|null,
  classes: ClassesType
}) => {
  const { LWTooltip } = Components;
  const extendedScore = voteProps.document?.extendedScore as NamesAttachedReactionsScore|undefined;

  const currentUser = useCurrentUser();

  const alreadyUsedReactions: NamesAttachedReactionsList = extendedScore?.reacts ?? {};
  const usersWhoReacted = alreadyUsedReactions[react]

  const allQuotesOrUndefined = uniq(usersWhoReacted?.flatMap(r => r.quotes))
  const allQuotes = filter(allQuotesOrUndefined, q => q !== undefined) as string[]
  
  const quotesWithUsers = allQuotes.map(quote => {
    const usersWhoReactedToQuote = usersWhoReacted?.filter(r => quote && r.quotes?.includes(quote))
    return { quote, users: usersWhoReactedToQuote  }
  })

  const { toggleReaction } = useNamesAttachedReactionsVoting(voteProps);

  function handleHoverQuote (quote: string) {
    clearHighlights(commentItemRef)
    markHighlights(allQuotes, dimHighlightClassName, commentItemRef)
    markHighlights([quote], highlightSelectorClassName, commentItemRef)
  }

  function handleLeaveQuote () {
    clearHighlights(commentItemRef)
    markHighlights(allQuotes, highlightSelectorClassName, commentItemRef)
  }

  if (!allQuotes.length) return null

  return <div className={classes.root}>
    {quotesWithUsers.map(({quote, users}) => {
      const currentUserReactedToQuote = users?.find(r => r.userId === currentUser?._id)
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
            <LWTooltip title={currentUserReactedToQuote ? "Remove your react to this snippet" : "Endorse this react for this snippet"} placement="right">
              <div className={classes.tinyQuoteReactToggle} onClick={() => toggleReaction(react, quote)}>
                {currentUserReactedToQuote ? "x" : "+1"}
              </div>
            </LWTooltip>
          </div>
        </div>
      })}
  </div>
} 


const ReactionQuotesComponent = registerComponent('ReactionQuotes', ReactionQuotes, {styles});

declare global {
  interface ComponentTypes {
    ReactionQuotes: typeof ReactionQuotesComponent
  }
}

