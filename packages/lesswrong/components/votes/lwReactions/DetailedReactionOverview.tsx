import React from 'react';
import type { EmojiReactName, QuoteLocator, UserReactInfo, VoteOnReactionType, NamesAttachedReactionsList } from '../../../lib/voting/namesAttachedReactions';
import { getNormalizedReactionsListFromVoteProps } from '@/lib/voting/reactionDisplayHelpers';
import { namesAttachedReactions as masterReactionList } from '../../../lib/voting/reactions';
import type { VotingProps } from '../votingProps';
import { useNamesAttachedReactionsVoting } from './NamesAttachedReactionsVoteOnComment';
import sumBy from 'lodash/sumBy';
import { defineStyles, useStyles } from '../../hooks/useStyles';
import ReactionIcon from "../ReactionIcon";
import ReactOrAntireactVote from "./ReactOrAntireactVote";
import LWTooltip from "../../common/LWTooltip";
import { slugify } from '@/lib/utils/slugify';
import Loading from '@/components/vulcan-core/Loading';

const styles = defineStyles("DetailedReactionOverview", (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    maxWidth: 450, 
    maxHeight: 400,
    overflowY: 'auto',
  },
  itemRowContainer: { 
    padding: '6px 0',
    borderBottom: `1px solid ${theme.palette.border.faint}`,
    '&:last-child': {
      borderBottom: 'none',
    }
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconAndLabel: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1, 
    marginRight: 8,
    minWidth: 0, 
    paddingLeft: 4,
  },
  iconAndLabelTextWrapper: { 
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    marginLeft: 8,
  },
  labelText: {
    fontWeight: 'bold',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: theme.palette.text.primary,
  },
  quoteTextDisplay: {
    fontSize: '0.9em',
    color: theme.palette.text.primary,
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  voteButtonsWrapper: { 
    flexShrink: 0,    
  },
  usersWhoReactedList: {
    fontSize: '12px',
    color: theme.palette.grey[500],
    paddingLeft: 30,
    marginTop: 4,
  }
}));

interface DisplayableReactionItem {
  id: string;
  reactionName: EmojiReactName;
  reactionLabel: string;
  iconComponent: React.ReactNode;
  quote: QuoteLocator | null;
  netCount: number;
  currentUserVote: VoteOnReactionType | null;
  reactions: UserReactInfo[];
}

interface DetailedReactionOverviewProps {
  voteProps: VotingProps<VoteableTypeClient>;
}

const DetailedReactionOverview = ({ voteProps }: DetailedReactionOverviewProps) => {
  const classes = useStyles(styles);
  const { getCurrentUserReactionVote, setCurrentUserReaction } = useNamesAttachedReactionsVoting(voteProps);
  const UsersWhoReacted = React.lazy(() => import('./UsersWhoReacted'));

  const normalizedReactionsList = getNormalizedReactionsListFromVoteProps(voteProps);
  const allUsedReactsMap: NamesAttachedReactionsList = normalizedReactionsList?.reacts ?? {};

  const displayItems: DisplayableReactionItem[] = [];

  masterReactionList.forEach(reactionDetail => {
    if (reactionDetail.deprecated) return;

    const reactionName = reactionDetail.name;
    const instancesOfThisType: UserReactInfo[] = allUsedReactsMap[reactionName] || [];

    const wholeDocInstances = instancesOfThisType.filter(r => !r.quotes || r.quotes.length === 0);
    if (wholeDocInstances.length > 0) {
      displayItems.push({
        id: reactionName,
        reactionName: reactionName,
        reactionLabel: reactionDetail.label,
        iconComponent: <ReactionIcon react={reactionName} />,
        quote: null,
        netCount: sumBy(wholeDocInstances, r => r.reactType === "disagreed" ? -1 : 1),
        currentUserVote: getCurrentUserReactionVote(reactionName, null),
        reactions: wholeDocInstances, 
      });
    }

    const quoteInstances = instancesOfThisType.filter(r => r.quotes && r.quotes.length > 0);
    const groupedByQuote: Record<string, UserReactInfo[]> = {};
    quoteInstances.forEach(qi => {
      const quoteStr = qi.quotes![0]; 
      if (!groupedByQuote[quoteStr]) {
        groupedByQuote[quoteStr] = [];
      }
      groupedByQuote[quoteStr].push(qi);
    });

    Object.entries(groupedByQuote).forEach(([quote, reactions]) => {
      const quoteLocator = quote as QuoteLocator;
      displayItems.push({
        id: `${reactionName}-${slugify(quoteLocator)}`,
        reactionName: reactionName,
        reactionLabel: reactionDetail.label, 
        iconComponent: <ReactionIcon react={reactionName} />,
        quote: quoteLocator,
        netCount: sumBy(reactions, r => r.reactType === "disagreed" ? -1 : 1),
        currentUserVote: getCurrentUserReactionVote(reactionName, quoteLocator),
        reactions: reactions, 
      });
    });
  });
  
  return (
    <div className={classes.root}>
      {displayItems.length === 0 && <p>No reactions yet.</p>}
      {displayItems.map((item) => (
        <div key={item.id} className={classes.itemRowContainer}>
          <div className={classes.itemRow}>
            <div className={classes.iconAndLabel}>
              {item.iconComponent}
              <div className={classes.iconAndLabelTextWrapper}>
                {item.quote ? (
                  <LWTooltip title={`${item.reactionLabel} on: "${item.quote}"`} placement="top-start">
                    <span className={classes.quoteTextDisplay}>{item.quote}</span>
                  </LWTooltip>
                ) : (
                  <LWTooltip title={item.reactionLabel} placement="top-start">
                    <span className={classes.labelText}>{item.reactionLabel}</span>
                  </LWTooltip>
                )}
              </div>
            </div>
            <div className={classes.voteButtonsWrapper}>
              <ReactOrAntireactVote
                reactionName={item.reactionName}
                quote={item.quote}
                netReactionCount={item.netCount}
                currentUserReaction={item.currentUserVote}
                setCurrentUserReaction={(name, vote) => setCurrentUserReaction(name, vote, item.quote)}
              />
            </div>
          </div>
          {item.reactions && item.reactions.length > 0 && (
            <div className={classes.usersWhoReactedList}>
              <React.Suspense fallback={<Loading />}>
                <UsersWhoReacted reactions={item.reactions} />
              </React.Suspense>
            </div>
          )}
        </div>
      ))}
    </div>
  );

};

export default DetailedReactionOverview;
