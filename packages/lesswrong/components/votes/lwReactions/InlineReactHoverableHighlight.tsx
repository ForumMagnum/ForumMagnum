import React, { useContext, useRef } from 'react';
import { QuoteLocator, NamesAttachedReactionsList } from '@/lib/voting/namesAttachedReactions';
import { getNormalizedReactionsListFromVoteProps } from '@/lib/voting/reactionDisplayHelpers';
import classNames from 'classnames';
import { HoveredReactionListContext, InlineReactVoteContext, SetHoveredReactionContext } from './HoveredReactionContextProvider';
import sumBy from 'lodash/sumBy';
import { useHover, UseHoverEventHandlers } from '@/components/common/withHover';
import type { VotingProps } from '../votingProps';
import { useCurrentUser } from '@/components/common/withUser';
import { defaultInlineReactsMode, type InlineReactsMode, SideItemVisibilityContext } from '@/components/dropdowns/posts/SetSideItemVisibility';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ReactionIcon from "../ReactionIcon";
import InlineReactHoverInfo from "./InlineReactHoverInfo";
import { SideItem } from "../../contents/SideItems";
import LWTooltip from "../../common/LWTooltip";
import SideItemLine from "../../contents/SideItemLine";
import { useLocation } from '@/lib/routeUtil';
import LWPopper from '@/components/common/LWPopper';

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
  },
  sidebarInlineReactIconsNonInbox: {
    display: "none",
    [theme.breakpoints.up('sm')]: {
      display: "inline-block",
    },
  },
  inlineReactSidebarLine: {
    background: theme.palette.sideItemIndicator.inlineReaction,
  },
}));

export const InlineReactHoverableHighlight = ({quote, reactions, isSplitContinuation=false, children, invertColors=false}: {
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  isSplitContinuation?: boolean
  children: React.ReactNode,
  invertColors?: boolean,
}) => {
  const classes = useStyles(styles);
  const quotedTextAnchorRef = useRef<HTMLSpanElement>(null);
  
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

  const hoverEnterLeaveEventHandlers = {
    onEnter: () => updateHoveredReactions(true),
    onLeave: () => updateHoveredReactions(false)
  };
  const { eventHandlers: sideItemLineEventHandlers, hover: sideItemLineHover } = useHover(hoverEnterLeaveEventHandlers);
  const { eventHandlers: iconsEventHandlers } = useHover(hoverEnterLeaveEventHandlers);
  
  const visibilityMode = useContext(SideItemVisibilityContext)?.inlineReactsMode ?? defaultInlineReactsMode;
  let sideItemIsVisible = getSideItemVisibility(visibilityMode, reactions);
  
  // In the DM inbox, inline reacts can be rendered just fine, since they aren't actually "side" items that'd be off-screen
  const { pathname } = useLocation();
  const isInbox = pathname.startsWith("/inbox");

  if (!voteProps) {
    return <>{children}</>
  }

  const normalizedReactions = getNormalizedReactionsListFromVoteProps(voteProps)?.reacts ?? {};
  const reactionsUsed = Object.keys(normalizedReactions).filter(react =>
    normalizedReactions[react]?.some(r=>r.quotes?.includes(quote))
  );
  
  return <>
    <span ref={quotedTextAnchorRef} className={classNames({
      [classes.reactionTypeHovered]: isHovered && !invertColors,
      [classes.reactionTypeHoveredInverted]: isHovered && invertColors,
    })}>
      {!isSplitContinuation && sideItemIsVisible && <SideItem options={{format: "icon"}}>
        {!isInbox && <span {...sideItemLineEventHandlers}>
          <SideItemLine colorClass={classes.inlineReactSidebarLine}/>
        </span>}

        <span {...iconsEventHandlers} className={classNames(
          classes.sidebarInlineReactIcons,
          !isInbox && classes.sidebarInlineReactIconsNonInbox,
        )}>
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
      </SideItem>}
      {children}
    </span>

    {sideItemLineHover && <LWPopper
      anchorEl={quotedTextAnchorRef.current}
      open={sideItemLineHover}
      placement="bottom-start"
      flip
    >
      <InlineReactHoverInfo
        quote={quote}
        reactions={reactions}
        voteProps={voteProps}
      />
    </LWPopper>}
  </>;
}

function getSideItemVisibility(visibilityMode: InlineReactsMode, reactions: NamesAttachedReactionsList) {
  // (reactions is already filtered by quote, we don't have to filter it again for this)
  const anyPositive = atLeastOneQuoteReactHasPositiveScore(reactions);

  switch(visibilityMode) {
    case "hidden":      return false;
    case "netPositive": return anyPositive;
    case "all":         return true;
  }
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



