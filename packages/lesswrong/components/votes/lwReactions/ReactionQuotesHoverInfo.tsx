import React from 'react';
import { EmojiReactName, getNormalizedReactionsListFromVoteProps, NamesAttachedReactionsList, QuoteLocator, UserReactInfo, VoteOnReactionType } from '../../../lib/voting/namesAttachedReactions';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useNamesAttachedReactionsVoting } from './NamesAttachedReactionsVoteOnComment';
import filter from 'lodash/filter';
import uniq from 'lodash/uniq';
import sumBy from 'lodash/sumBy';
import type { VotingProps } from '../votingProps';
import { ContentItemBody } from '../../common/ContentItemBody';

const styles = (theme: ThemeType) => ({
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

const ReactionQuotesHoverInfo = ({react, quote, voteProps, commentBodyRef, classes}: {
  react: EmojiReactName,
  quote: QuoteLocator,
  voteProps: VotingProps<VoteableTypeClient>,
  commentBodyRef?: React.RefObject<ContentItemBody>|null,
  classes: ClassesType<typeof styles>
}) => {
  const { ReactOrAntireactVote, UsersWhoReacted } = Components;
  const normalizedReactions = getNormalizedReactionsListFromVoteProps(voteProps);

  const reactionsOfType: UserReactInfo[] = normalizedReactions?.reacts?.[react] ?? [];
  const reactionsToQuote = reactionsOfType.filter(r => r.quotes?.[0] === quote);

  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);

  function handleHoverQuote (quote: string) {
    // TODO
  }

  function handleLeaveQuote () {
    // TODO
  }

  if (!reactionsToQuote.length) return null

  const netQuoteReactionCount = sumBy(reactionsToQuote, (reaction) => reaction.reactType==="disagreed"?-1:1)
  const setCurrentUserQuoteReaction = (reactionName: EmojiReactName, reaction: VoteOnReactionType) => setCurrentUserReaction(reactionName, reaction, quote);

  return <div className={classes.root}>
    <div key={quote} className={classes.quote}>
      <div className={classes.tinyQuoteRow} onMouseEnter={() => handleHoverQuote(quote)} onMouseLeave={() => handleLeaveQuote()}>
        <div className={classes.tinyQuoteWrapper}>
          <div className={classes.tinyQuote}>
            {quote.trim()}
          </div>
          <div className={classes.usersWhoQuoted}>
            <UsersWhoReacted reactions={reactionsToQuote} />
          </div>
        </div>
        <ReactOrAntireactVote
          reactionName={react}
          currentUserReaction={getCurrentUserReactionVote(react, quote)}
          netReactionCount={netQuoteReactionCount}
          quote={quote}
          setCurrentUserReaction={setCurrentUserQuoteReaction}
        />
      </div>
    </div>
  </div>
}


const ReactionQuotesHoverInfoComponent = registerComponent('ReactionQuotesHoverInfo', ReactionQuotesHoverInfo, {styles});

declare global {
  interface ComponentTypes {
    ReactionQuotesHoverInfo: typeof ReactionQuotesHoverInfoComponent
  }
}

