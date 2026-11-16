import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { QuoteLocator, NamesAttachedReactionsList } from '@/lib/voting/namesAttachedReactions';
import { getNormalizedReactionsListFromVoteProps } from '@/lib/voting/reactionDisplayHelpers';
import classNames from 'classnames';
import { HoveredReactionListContext, InlineReactVoteContext, SetHoveredReactionContext, type HoveredReactionChange } from './HoveredReactionContextProvider';
import sumBy from 'lodash/sumBy';
import { useHover } from '@/components/common/withHover';
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
  const hoveredReactionNamesRef = useRef<string[]>([]);

  const onEnter = () => markReactionsHovered(setHoveredReaction, quote, reactions, hoveredReactionNamesRef);
  const onLeave = useCallback(
    () => clearHoveredReactions(setHoveredReaction, quote, hoveredReactionNamesRef),
    [setHoveredReaction, quote]
  );
  const {
    eventHandlers: sideItemLineEventHandlers,
    hover: sideItemLineHover,
    forceUnHover: unhoverSideItemLine,
  } = useHover({ onEnter, onLeave });
  const { eventHandlers: iconsEventHandlers, forceUnHover: unhoverIcons } = useHover({ onEnter, onLeave });
  
  const visibilityMode = useContext(SideItemVisibilityContext)?.inlineReactsMode ?? defaultInlineReactsMode;
  let sideItemIsVisible = getSideItemVisibility(visibilityMode, reactions);
  
  // In the DM inbox, inline reacts can be rendered just fine, since they aren't actually "side" items that'd be off-screen
  const { pathname } = useLocation();
  const isInbox = pathname.startsWith("/inbox");

  const normalizedReactions = voteProps ? getNormalizedReactionsListFromVoteProps(voteProps)?.reacts : undefined;
  // In netPositive mode, hide the icons of reactions on this span that have
  // been anti-reacted down to zero or below, even if other reactions on the
  // same span are positive. (They're still listed in the hover info.)
  const reactionsUsed = Object.keys(normalizedReactions ?? {}).filter(react =>
    normalizedReactions?.[react]?.some(r=>r.quotes?.includes(quote))
    && (visibilityMode !== "netPositive" || quoteReactHasPositiveScore(reactions, react))
  );

  // Anti-reacting from the hover popup can remove the hovered icon (or the
  // whole side item) from under the mouse without a mouseleave event, which
  // used to leave the quoted text highlighted indefinitely.
  const visibleIconsKey = sideItemIsVisible ? reactionsUsed.join(",") : "";
  useEffect(() => {
    return () => {
      unhoverSideItemLine();
      unhoverIcons();
    };
  }, [visibleIconsKey, unhoverSideItemLine, unhoverIcons]);

  if (!voteProps) {
    return <>{children}</>
  }

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

function getReactionNamesOnQuote(reactions: NamesAttachedReactionsList, quote: QuoteLocator): string[] {
  return Object.entries(reactions)
    .filter(([_reactionName, documentReactionInfo]) =>
      documentReactionInfo?.some(({ quotes }) => quotes?.[0] === quote)
    )
    .map(([reactionName]) => reactionName);
}

function markReactionsHovered(
  setHoveredReaction: ((change: HoveredReactionChange) => void)|null,
  quote: QuoteLocator,
  reactions: NamesAttachedReactionsList,
  hoveredReactionNamesRef: React.MutableRefObject<string[]>,
) {
  const reactionNames = getReactionNamesOnQuote(reactions, quote);
  for (const reactionName of reactionNames) {
    setHoveredReaction?.({ isHovered: true, quote, reactionName });
  }
  hoveredReactionNamesRef.current = reactionNames;
}

function clearHoveredReactions(
  setHoveredReaction: ((change: HoveredReactionChange) => void)|null,
  quote: QuoteLocator,
  hoveredReactionNamesRef: React.MutableRefObject<string[]>,
) {
  for (const reactionName of hoveredReactionNamesRef.current) {
    setHoveredReaction?.({ isHovered: false, quote, reactionName });
  }
  hoveredReactionNamesRef.current = [];
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
  
  return Object.keys(reactions).some(react => quoteReactHasPositiveScore(reactions, react));
}

function quoteReactHasPositiveScore(reactions: NamesAttachedReactionsList, react: string): boolean {
  const netReaction = sumBy(reactions[react], r => r.reactType==="disagreed" ? -1 : 1);
  return netReaction > 0;
}

export default InlineReactHoverableHighlight;



