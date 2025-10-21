import React, { useContext } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { QuoteLocator, NamesAttachedReactionsList } from '@/lib/voting/namesAttachedReactions';
import { getNormalizedReactionsListFromVoteProps } from '@/lib/voting/reactionDisplayHelpers';
import classNames from 'classnames';
import { HoveredReactionListContext, InlineReactVoteContext, SetHoveredReactionContext } from './HoveredReactionContextProvider';
import sumBy from 'lodash/sumBy';
import { useHover, UseHoverEventHandlers } from '@/components/common/withHover';
import type { VotingProps } from '../votingProps';
import { useCurrentUser } from '@/components/common/withUser';
import { defaultInlineReactsMode, SideItemVisibilityContext } from '@/components/dropdowns/posts/SetSideItemVisibility';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ReactionIcon from "../ReactionIcon";
import InlineReactHoverInfo from "./InlineReactHoverInfo";
import { SideItem } from "../../contents/SideItems";
import LWTooltip from "../../common/LWTooltip";
import SideItemLine from "../../contents/SideItemLine";
import { useLocation } from '@/lib/routeUtil';

const styles = defineStyles("InlineReactHoverableHighlight", (theme: ThemeType) => ({
  reactionTypeHovered: {
    backgroundColor: theme.palette.greyAlpha(0.1),
  },
  reactionTypeHoveredInverted: {
    backgroundColor: theme.palette.greyAlpha(0.4),
  },

  sidebarInlineReactIcons: {
    opacity: 0.5,
    marginLeft: 4,
    paddingLeft: 4,
    paddingRight: 4,
    
    [theme.breakpoints.up('sm')]: {
      display: "inline-block",
    },
  },
  hideInlineReactsDefault: {
    display: "none",
  },
  inlineReactSidebarLine: {
    background: theme.palette.sideItemIndicator.inlineReaction,
  },
  
  // Keeping this empty class around is necessary for the following @global style to work properly
  highlight: {},
}));

export const InlineReactHoverableHighlight = ({quote, reactions, isSplitContinuation=false, children, invertColors=false}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  isSplitContinuation?: boolean
  children: React.ReactNode,
  invertColors?: boolean,
}) => {
  const classes = useStyles(styles);
  
  const hoveredReactions = useContext(HoveredReactionListContext);
  const voteProps = useContext(InlineReactVoteContext);

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

  const visibilityMode = useContext(SideItemVisibilityContext)?.inlineReactsMode ?? defaultInlineReactsMode;
  let sideItemIsVisible = false
  switch(visibilityMode) {
    case "hidden":      sideItemIsVisible = false; break;
    case "netPositive": sideItemIsVisible = anyPositive; break;
    case "all":         sideItemIsVisible = true; break;
  }
  
  // We underline any given inline react if either:
  // 1) the quote itself is hovered over, or
  // 2) if the post/comment is hovered over, and the react has net-positive agreement across all users
  const shouldUnderline = isHovered || anyPositive;
  if (!voteProps) {
    return <>{children}</>
  }

  return (
    <span className={classNames({
      [classes.highlight]: shouldUnderline,
      [classes.reactionTypeHovered]: isHovered && !invertColors,
      [classes.reactionTypeHoveredInverted]: isHovered && invertColors,
    })}>
      {!isSplitContinuation && sideItemIsVisible && <SideItem options={{format: "icon"}}>
        <SidebarInlineReact
          hoverEventHandlers={eventHandlers}
          quote={quote} reactions={reactions} voteProps={voteProps}
        />
      </SideItem>}
      {children}
    </span>
  );
}

const SidebarInlineReact = ({quote,reactions, voteProps, hoverEventHandlers}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  voteProps: VotingProps<VoteableTypeClient>,
  hoverEventHandlers: UseHoverEventHandlers,
}) => {
  const classes = useStyles(styles);

  // In the DM inbox, inline reacts can be rendered just fine, since they aren't actually "side" items that'd be off-screen
  const { pathname } = useLocation();
  const isInbox = pathname.startsWith("/inbox");

  const normalizedReactions = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts ?? {};
  const reactionsUsed = Object.keys(normalizedReactions).filter(react =>
    normalizedReactions[react]?.some(r=>r.quotes?.includes(quote))
  );
  
  return <>
    {!isInbox && <SideItemLine colorClass={classes.inlineReactSidebarLine}/>}
    <span {...hoverEventHandlers} className={classNames(classes.sidebarInlineReactIcons, !isInbox && classes.hideInlineReactsDefault)}>
      {reactionsUsed.map(r => <span key={r}>
        <LWTooltip
          title={<InlineReactHoverInfo
            quote={quote}
            reactions={reactions}
            voteProps={voteProps}
          />}
          placement="bottom-start"
          tooltip={false}
          flip={true}
          inlineBlock={false}
          clickable={true}
        >
          <ReactionIcon react={r}/>
        </LWTooltip>
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

export default InlineReactHoverableHighlight;



