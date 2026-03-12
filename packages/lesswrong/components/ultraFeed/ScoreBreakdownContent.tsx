import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { PostScoreBreakdown, ThreadScoreBreakdown, FeedItemSourceType, FeedCommentMetaInfo, FeedPostMetaInfo } from './ultraFeedTypes';
import LWTooltip from '../common/LWTooltip';
import { DEFAULT_RANKING_CONFIG, buildRankingConfigFromSettings } from '../../server/ultraFeed/ultraFeedRankingConfig';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';

export const scoreBreakdownStyles = defineStyles('ScoreBreakdownContent', (theme: ThemeType) => ({
  tooltipContent: {
    padding: '12px 16px',
    maxWidth: 400,
  },
  totalScore: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: theme.palette.text.primary,
  },
  section: {
    marginBottom: 12,
  },
  termRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    marginBottom: 4,
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.05),
    },
  },
  termName: {
    marginRight: 16,
    whiteSpace: 'nowrap',
  },
  termValue: {
    fontWeight: 500,
  },
  positiveValue: {
    color: theme.palette.primary.main,
  },
  negativeValue: {
    color: theme.palette.error.main,
  },
  zeroValue: {
    opacity: 0.5,
    color: theme.palette.text.primary,
  },
  multiplier: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
  },
  multiplierPenalty: {
    color: theme.palette.error.main,
  },
  multiplierNoPenalty: {
    opacity: 0.5,
  },
  sourcesSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: theme.palette.border.slightlyFaint,
    fontSize: 16,
    lineHeight: 1.5,
  },
  sourcesTitle: {
    display: 'inline',
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    marginRight: 4,
  },
  sourceTag: {
    display: 'inline',
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.palette.text.primary,
  },
  sourceSeparator: {
    display: 'inline',
    fontSize: 16,
    fontStyle: 'normal',
    color: theme.palette.text.primary,
    marginRight: 4,
  },
  alterBonusesButton: {
    marginTop: 12,
    padding: '6px 12px',
    fontSize: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.paper,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'block',
    width: 'auto',
    marginLeft: 'auto',
    marginRight: 'auto',
    minWidth: 120,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  // Override z-index for dialog that opens from inside tooltip to be higher than tooltip
  alterBonusesDialogWrapper: {
    zIndex: theme.zIndexes.lwPopperTooltip + 1,
  },
}));

const formatScore = (value: number): string => {
  return value.toFixed(2);
};

const getUserRankingConfig = (settings?: ReturnType<typeof useUltraFeedSettings>['settings']) => {
  if (!settings?.resolverSettings?.unifiedScoring) {
    return DEFAULT_RANKING_CONFIG;
  }
  return buildRankingConfigFromSettings(settings.resolverSettings.unifiedScoring);
};

const splitZeroAndNonZeroTerms = (terms: Array<{ name: string; value: number }>) => {
  const nonZero = terms.filter(c => Math.abs(c.value) >= 0.01);
  const zero = terms
    .filter(c => Math.abs(c.value) < 0.01)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { nonZero, zero };
};

const sourceLabels: Record<FeedItemSourceType, string> = {
  'subscriptionsPosts': 'you follow the author',
  'subscriptionsComments': 'comments by authors you follow',
  'recombee-lesswrong-ultrafeed': 'personalized AI-recommendation based on your reads and votes',
  'hacker-news': 'recently published post',
  'bookmarks': 'you bookmarked this',
  'quicktakes': 'recent Quick Take',
  'recentComments': 'recent comments',
  'spotlights': 'LessWrong featured item',
};

const sourceTooltips: Partial<Record<FeedItemSourceType, string>> = {
  'recombee-lesswrong-ultrafeed': 'LessWrong uses Recombee, trained on your reads and votes',
  'bookmarks': 'Bookmarks are inserted periodically into your feed to remind you about them, you can turn this off in the settings',
};

function getPostTermExplanations(settings?: ReturnType<typeof useUltraFeedSettings>['settings']): Record<string, string> {
  const config = getUserRankingConfig(settings);
  const postConfig = config.posts;
  const subscribedBonusSetting = settings?.resolverSettings?.unifiedScoring?.subscribedBonusSetting ?? 3;
  const bias = postConfig.timeDecayBias;
  const scale = postConfig.timeDecayScale;
  
  return {
    "Subscribed Author": `Bonus for posts from authors you follow. Formula: subscribedBonusSetting × 2 = ${subscribedBonusSetting} × 2 = ${postConfig.subscribedBonus}. Configurable in settings (0-5, gives 0-10 bonus)`,
    "Karma Bonus (time-decaying)": `Decay: min(karma × ${scale}^0.25 / (ageHrs + ${bias})^0.25, ${postConfig.karmaMaxBonus}). Age 0: 100%, 1day: 78%, 3days: 67%, 1week: 56%. All items start with base 1 point.`,
    "Karma Bonus (timeless)": `No time decay: min(karma^${postConfig.karmaSuperlinearExponent} / ${postConfig.karmaDivisor}, ${postConfig.karmaMaxBonus}). Used for personalized recommendations and author subscriptions. All items start with base 1 point.`,
    "Topic Affinity": `Bonus for posts on topics you read often (0-${postConfig.topicAffinityMaxBonus}, TODO)`,
    "Base Value": "All items start with a base value of 1 point before any bonuses are applied",
  };
}

function getThreadTermExplanations(settings?: ReturnType<typeof useUltraFeedSettings>['settings']): Record<string, string> {
  const config = getUserRankingConfig(settings);
  const threadConfig = config.threads;
  const postConfig = config.posts;
  const subscribedBonusSetting = settings?.resolverSettings?.unifiedScoring?.subscribedBonusSetting ?? 3;
  const bias = threadConfig.timeDecayBias;
  const scale = threadConfig.timeDecayScale;
  
  return {
    "Subscribed Comments": `Flat bonus per unread comment from authors you follow: subscribedBonusSetting × 2 = ${subscribedBonusSetting} × 2 = ${threadConfig.subscribedCommentBonus} per comment. Applies in addition to karma bonus. Configurable in settings (0-5, gives 0-10 per comment)`,
    "Prior Engagement": `+${threadConfig.engagementParticipationBonus} if commented, else +${threadConfig.engagementVotingBonus} if voted, else +${threadConfig.engagementViewingBonus} if viewed`,
    "Replies to You": `Someone replied to your comment (+${threadConfig.repliesToYouBonus}, TODO)`,
    "Your Post": `New comments on a post you wrote (+${threadConfig.yourPostBonus}, TODO)`,
    "Karma Bonus (time-decaying)": `Decay: min(sum(karma × ${scale}^0.25 / (ageHrs + ${bias})^0.25), ${threadConfig.karmaMaxBonus}) for ALL unread comments. Age 0: 100%, 1day: 78%, 3days: 67%, 1week: 56%. All items start with base 1 point.`,
    "Topic Affinity": `Bonus for threads on topics you read often (0-${postConfig.topicAffinityMaxBonus}) TODO`,
    "Quicktake": `Top-level comment is an unread quicktake (+${threadConfig.quicktakeBonus})`,
    "Read Post Context": `You've read the post, so you have context (+${threadConfig.readPostContextBonus})`,
    "Base Value": "All items start with a base value of 1 point before any bonuses are applied",
  };
}


const ScoreTerm = ({ 
  name, 
  value, 
  explanations 
}: { 
  name: string; 
  value: number;
  explanations: Record<string, string>;
}) => {
  const classes = useStyles(scoreBreakdownStyles);
  
  const isZero = value === 0;
  const isNearZero = Math.abs(value) < 0.01;
  const sign = value > 0 ? '+' : value < 0 ? '' : '';
  const valueClass = isNearZero ? classes.zeroValue : value > 0 ? classes.positiveValue : classes.negativeValue;
  const rowClass = isZero ? classes.zeroValue : '';
  const explanation = explanations[name] ?? '';
  
  const row = (
    <div className={classNames(classes.termRow, rowClass)}>
      <span className={classes.termName}>{name}</span>
      <span className={classNames(classes.termValue, valueClass)}>
        {sign}{formatScore(value)}
      </span>
    </div>
  );
  
  if (!explanation) {
    return row;
  }
  
  return (
    <LWTooltip title={explanation} placement="left" inlineBlock={false} As="div">
      {row}
    </LWTooltip>
  );
};

const MultiplierRow = ({ 
  label, 
  value, 
  tooltip 
}: { 
  label: string; 
  value: number; 
  tooltip: string;
}) => {
  const classes = useStyles(scoreBreakdownStyles);
  const isNeutral = Math.abs(value - 1) < 0.01;
  const isPenalty = value < 1;
  
  return (
    <LWTooltip 
      title={tooltip}
      placement="left"
      inlineBlock={false}
      As="div"
    >
      <div className={classNames(classes.multiplier, {
        [classes.multiplierPenalty]: isPenalty,
        [classes.multiplierNoPenalty]: isNeutral
      })}>
        {label}: ×{formatScore(value)}
      </div>
    </LWTooltip>
  );
};

type SourcesSectionProps = 
  | { sources?: FeedItemSourceType[]; metaInfo?: FeedPostMetaInfo; itemType: 'post' }
  | { sources?: FeedItemSourceType[]; metaInfo?: FeedCommentMetaInfo; itemType: 'commentThread' };

const SourcesSection = ({ sources, metaInfo, itemType }: SourcesSectionProps) => {
  const classes = useStyles(scoreBreakdownStyles);
  
  if (!sources || sources.length === 0) {
    return null;
  }
  
  return (
    <div className={classes.sourcesSection}>
      <span className={classes.sourcesTitle}>Shown to you because</span>
      {sources.map((source, index) => {
        let label = sourceLabels[source];
        // Only comment threads have isParentPostRead context
        if (source === 'recentComments' && itemType === 'commentThread' && metaInfo?.isParentPostRead) {
          label = 'Recent comments on a post you read';
        }
        
        const tooltip = sourceTooltips[source];
        const tagContent = <span className={classes.sourceTag}>{label}</span>;
        const isLast = index === sources.length - 1;
        
        if (tooltip) {
          return (
            <span key={source}>
              <LWTooltip title={tooltip} placement="top">
                {tagContent}
              </LWTooltip>
              {!isLast && <span className={classes.sourceSeparator}>,</span>}
            </span>
          );
        }
        
        return (
          <span key={source}>
            {tagContent}
            {!isLast && <span className={classes.sourceSeparator}>,</span>}
          </span>
        );
      })}
    </div>
  );
};

const ScoreBreakdown = ({ 
  total, 
  terms, 
  multipliers, 
  explanations 
}: { 
  total: number;
  terms: Array<{ name: string; value: number }>;
  multipliers: Array<{ label: string; value: number; tooltip: string }>;
  explanations: Record<string, string>;
}) => {
  const classes = useStyles(scoreBreakdownStyles);
  const { nonZero, zero } = splitZeroAndNonZeroTerms(terms);
  const baseValue = { name: "Base Value", value: 1 };
  
  return (
    <>
      <div className={classes.totalScore}>
        Total Score: {formatScore(total)}
      </div>
      
      <div className={classes.section}>
        {nonZero.map(({ name, value }) => (
          <ScoreTerm key={name} name={name} value={value} explanations={explanations} />
        ))}
        <ScoreTerm key="base" name={baseValue.name} value={baseValue.value} explanations={explanations} />
        {zero.map(({ name, value }) => (
          <ScoreTerm key={name} name={name} value={value} explanations={explanations} />
        ))}
      </div>
      
      {multipliers.map((multiplier) => (
        <MultiplierRow 
          key={multiplier.label}
          label={multiplier.label}
          value={multiplier.value}
          tooltip={multiplier.tooltip}
        />
      ))}
    </>
  );
};

export const PostScoreBreakdownContent = ({ breakdown, sources, metaInfo }: { breakdown: PostScoreBreakdown; sources?: FeedItemSourceType[]; metaInfo?: FeedPostMetaInfo }) => {
  const { settings } = useUltraFeedSettings();
  const { terms, typeMultiplier, total } = breakdown;
  
  const isRecombeeOrSubscription = sources?.includes('recombee-lesswrong-ultrafeed') || sources?.includes('subscriptionsPosts');
  const karmaBonusLabel = isRecombeeOrSubscription ? "Karma Bonus (timeless)" : "Karma Bonus (time-decaying)";
  
  const allTerms = [
    { name: "Subscribed Author", value: terms.subscribedBonus },
    { name: karmaBonusLabel, value: terms.karmaBonus },
    { name: "Topic Affinity", value: terms.topicAffinityBonus },
  ];
  
  const multipliers = [
    {
      label: "Type Multiplier",
      value: typeMultiplier,
      tooltip: Math.abs(typeMultiplier - 1) < 0.01 
        ? "No type multiplier applied (1.0×)"
        : `Posts are multiplied by ${typeMultiplier}× to adjust their relative priority vs threads`
    }
  ];
  
  return (
    <>
      <SourcesSection sources={sources} metaInfo={metaInfo} itemType="post" />
      <ScoreBreakdown 
        total={total}
        terms={allTerms}
        multipliers={multipliers}
        explanations={getPostTermExplanations(settings)}
      />
    </>
  );
};

export const ThreadScoreBreakdownContent = ({ breakdown, sources, metaInfo }: { breakdown: ThreadScoreBreakdown; sources?: FeedItemSourceType[]; metaInfo?: FeedCommentMetaInfo }) => {
  const { settings } = useUltraFeedSettings();
  const { terms, repetitionPenaltyMultiplier, typeMultiplier, total } = breakdown;
  
  const allTerms = [
    { name: "Subscribed Comments", value: terms.unreadSubscribedCommentBonus },
    { name: "Prior Engagement", value: terms.engagementContinuationBonus },
    { name: "Replies to You", value: terms.repliesToYouBonus },
    { name: "Your Post", value: terms.yourPostActivityBonus },
    { name: "Karma Bonus (time-decaying)", value: terms.overallKarmaBonus },
    { name: "Topic Affinity", value: terms.topicAffinityBonus },
    { name: "Quicktake", value: terms.quicktakeBonus },
    { name: "Read Post Context", value: terms.readPostContextBonus },
  ];
  
  const multipliers = [
    {
      label: "Repetition Penalty",
      value: repetitionPenaltyMultiplier,
      tooltip: Math.abs(repetitionPenaltyMultiplier - 1) < 0.01 
        ? "No penalty is applied to this thread for having been shown recently"
        : "This item has been penalized since the same thread was already shown recently"
    },
    {
      label: "Type Multiplier",
      value: typeMultiplier,
      tooltip: Math.abs(typeMultiplier - 1) < 0.01 
        ? "No type multiplier applied (1.0×)"
        : `Threads are multiplied by ${typeMultiplier}× to adjust their relative priority`
    }
  ];
  
  return (
    <>
      <SourcesSection sources={sources} metaInfo={metaInfo} itemType="commentThread" />
      <ScoreBreakdown 
        total={total}
        terms={allTerms}
        multipliers={multipliers}
        explanations={getThreadTermExplanations(settings)}
      />
    </>
  );
};

