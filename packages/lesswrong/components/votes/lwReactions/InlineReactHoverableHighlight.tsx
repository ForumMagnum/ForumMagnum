import React, { useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import type { NamesAttachedReactionsList, QuoteLocator } from '../../../lib/voting/namesAttachedReactions';
import type { VotingProps } from '../votingProps';
import classNames from 'classnames';
import { HoveredReactionListContext, SetHoveredReactionContext } from './HoveredReactionContextProvider';
import sumBy from 'lodash/sumBy';
import { useHover } from '@/components/common/withHover';

const styles = (theme: ThemeType) => ({
  reactionTypeHovered: {
    backgroundColor: theme.palette.grey[200],
  },
  
  // Keeping this empty class around is necessary for the following @global style to work properly
  highlight: {},
  // Comment or post hovered
  "@global": {
    [
      ".CommentsItem-body:hover .InlineReactHoverableHighlight-highlight"
      +", .Answer-answer:hover .InlineReactHoverableHighlight-highlight"
      +", .PostsPage-postContent:hover .InlineReactHoverableHighlight-highlight"
    ]: {
      textDecorationLine: 'underline',
      textDecorationStyle: 'dashed',
      textDecorationColor: theme.palette.text.dim4,
      textUnderlineOffset: '3px'
    },
  }
})

const InlineReactHoverableHighlight = ({quote,reactions, voteProps, children, classes}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  voteProps: VotingProps<VoteableTypeClient>,
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const { InlineReactHoverInfo, LWTooltip } = Components;

  const hoveredReactions = useContext(HoveredReactionListContext);
  const isHovered = hoveredReactions
    && Object.keys(reactions).some(reaction =>
      hoveredReactions.find(r=>r.reactionName===reaction && (r.quote === quote || r.quote === null))
    );

  const setHoveredReaction = useContext(SetHoveredReactionContext);

  function updateHoveredReactions(isHovered: boolean) {
    for (const [reactionName, documentReactionInfo] of Object.entries(reactions)) {
      if (documentReactionInfo) {
        for (const { quotes } of documentReactionInfo) {
          const [reactQuote] = quotes ?? [];
          if (quote === reactQuote) {
            setHoveredReaction?.({ isHovered, quote: reactQuote, reactionName });
          }
        }
      }
    }
  }

  const { eventHandlers } = useHover({
    onEnter: () => updateHoveredReactions(true),
    onLeave: () => updateHoveredReactions(false)
  });
  
  // (reactions is already filtered by quote, we don't have to filter it again for this)
  const anyPositive = atLeastOneQuoteReactHasPositiveScore(reactions);
  
  // We underline any given inline react if either:
  // 1) the quote itself is hovered over, or
  // 2) if the post/comment is hovered over, and the react has net-positive agreement across all users
  const shouldUnderline = isHovered || anyPositive;

  return <LWTooltip
    title={<InlineReactHoverInfo
      quote={quote}
      reactions={reactions}
      voteProps={voteProps}
    />}
    placement="top-start"
    tooltip={false}
    flip={false}
    inlineBlock={false}
    clickable={true}
  >
    <span {...eventHandlers} className={classNames({
      [classes.highlight]: shouldUnderline,
      [classes.reactionTypeHovered]: isHovered
    })}>
      {children}
    </span>
  </LWTooltip>
}

function atLeastOneQuoteReactHasPositiveScore(reactions: NamesAttachedReactionsList): boolean {
  if (!reactions) {
    return false;
  }
  
  for (let react of Object.keys(reactions)) {
    const netReaction = sumBy(reactions[react], r => r.reactType==="disagreed" ? -1 : 1);
    if (netReaction > 0) {
      return true;
    }
  }
  
  return false;
}

const InlineReactHoverableHighlightComponent = registerComponent('InlineReactHoverableHighlight', InlineReactHoverableHighlight, {styles});

declare global {
  interface ComponentTypes {
    InlineReactHoverableHighlight: typeof InlineReactHoverableHighlightComponent
  }
}

