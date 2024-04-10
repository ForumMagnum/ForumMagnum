import React, { useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import type { NamesAttachedReactionsList, QuoteLocator } from '../../../lib/voting/namesAttachedReactions';
import type { VotingProps } from '../votingProps';
import classNames from 'classnames';
import { HoveredReactionListContext } from './HoveredReactionContextProvider';
import sumBy from 'lodash/sumBy';

const styles = (theme: ThemeType): JssStyles => ({
  highlight: {
    "&:hover": {
      backgroundColor: theme.palette.grey[200],
    },
  },
  
  reactionTypeHovered: {
    backgroundColor: theme.palette.background.primaryTranslucentHeavy,
  },

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
  classes: ClassesType,
}) => {
  const { InlineReactHoverInfo, LWTooltip } = Components;
  const hoveredReactions = useContext(HoveredReactionListContext);
  const isHovered = hoveredReactions
    && Object.keys(reactions).some(reaction =>
      hoveredReactions.find(r=>r===reaction)
    );
  
  // (reactions is already filtered by quote, we don't have to filter it again for this)
  const anyPositive = atLeastOneQuoteReactHasPositiveScore(reactions);
  
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
    <span className={classNames({
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

