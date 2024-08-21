import React, { useContext } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { QuoteLocator, NamesAttachedReactionsList, getNormalizedReactionsListFromVoteProps } from '@/lib/voting/namesAttachedReactions';
import classNames from 'classnames';
import { HoveredReactionListContext, InlineReactVoteContext, SetHoveredReactionContext } from './HoveredReactionContextProvider';
import sumBy from 'lodash/sumBy';
import { useHover } from '@/components/common/withHover';
import type { VotingProps } from '../votingProps';
import { useCurrentUser } from '@/components/common/withUser';

const styles = (theme: ThemeType) => ({
  reactionTypeHovered: {
    backgroundColor: theme.palette.grey[200],
  },

  sidebarInlineReactIcons: {
    display: "none",
    width: "100%",
    
    [theme.breakpoints.up('sm')]: {
      display: "block",
    },
  },
  inlineReactSidebarLine: {
    background: "#88f", //TODO: themeify
  },
  
  // Keeping this empty class around is necessary for the following @global style to work properly
  highlight: {},

  // Comment hovered (post uses side-icons instead)
  "@global": {
    [
      ".CommentsItem-body:hover .InlineReactHoverableHighlight-highlight"
      +", .Answer-answer:hover .InlineReactHoverableHighlight-highlight"
    ]: {
      textDecorationLine: 'underline',
      textDecorationStyle: 'dashed',
      textDecorationColor: theme.palette.text.dim4,
      textUnderlineOffset: '3px'
    },
  }
})

const InlineReactHoverableHighlight = ({quote, reactions, isSplitContinuation=false, children, classes}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  isSplitContinuation?: boolean
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const { InlineReactHoverInfo, SideItem, LWTooltip } = Components;

  const hoveredReactions = useContext(HoveredReactionListContext);
  const voteProps = useContext(InlineReactVoteContext)!;

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
      {!isSplitContinuation && <SideItem options={{format: "icon"}}>
        <SidebarInlineReact quote={quote} reactions={reactions} voteProps={voteProps} classes={classes} />
      </SideItem>}
      {children}
    </span>
  </LWTooltip>
}

const SidebarInlineReact = ({quote,reactions, voteProps, classes}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const { SideItemLine } = Components;
  const currentUser = useCurrentUser();
  const normalizedReactions = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts ?? {};
  const reactionsUsed = Object.keys(normalizedReactions).filter(react =>
    normalizedReactions[react]?.some(r=>r.quotes?.includes(quote))
  );
  
  return <>
    <SideItemLine colorClass={classes.inlineReactSidebarLine}/>
    <span className={classes.sidebarInlineReactIcons}>
      {reactionsUsed.map(r => <span key={r}>
        <Components.ReactionIcon react={r}/>
      </span>)}
    </span>
  </>
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

