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
  componentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    marginBottom: 4,
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.05),
    },
  },
  componentName: {
    marginRight: 16,
    whiteSpace: 'nowrap',
  },
  componentValue: {
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
    borderBottom: `1px solid rgba(0,0,0,0.1)`,
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

const sourceLabels: Record<FeedItemSourceType, string> = {
  'subscriptionsPosts': 'you follow the author',
  'subscriptionsComments': 'comments by authors you follow',
  'recombee-lesswrong-custom': 'personalized AI-recommendation based on your reads and votes',
  'hacker-news': 'recently published post',
  'bookmarks': 'you bookmarked this',
  'quicktakes': 'recent Quick Take',
  'recentComments': 'recent comments',
  'spotlights': 'LessWrong featured item',
};

const sourceTooltips: Partial<Record<FeedItemSourceType, string>> = {
  // 'subscriptionsPosts': 'Post from an author you follow',
  // 'subscriptionsComments': 'This comment is from an author you follow',
  'recombee-lesswrong-custom': 'LessWrong uses Recombee, trained on your reads and votes',
  // 'hacker-news': 'This post was recently published',
  'bookmarks': 'Bookmarks are inserted periodically into your feed to remind you about them, you can turn this off in the settings',
  // 'quicktakes': 'This is a quicktake (short form post)',
  // 'recentComments': 'This is a recent comment',
  // 'spotlights': 'This item was selected as a spotlight',
};

function getPostComponentExplanations(settings?: ReturnType<typeof useUltraFeedSettings>['settings']): Record<string, string> {
  const config = getUserRankingConfig(settings);
  const postConfig = config.posts;
  const subscribedBonusSetting = settings?.resolverSettings?.unifiedScoring?.subscribedBonusSetting ?? 3;
  const bias = postConfig.timeDecayBias;
  const scale = postConfig.timeDecayScale;
  const multiplier = postConfig.typeMultiplier;
  
  return {
    "Subscribed Author": `Bonus for posts from authors you follow. Formula: subscribedBonusSetting × 2 = ${subscribedBonusSetting} × 2 = ${postConfig.subscribedBonus}. Configurable in settings (0-5, gives 0-10 bonus)`,
    "Karma Bonus (time-decaying)": `Decay: min(karma × ${scale}^0.25 / (ageHrs + ${bias})^0.25, ${postConfig.karmaMaxBonus}). Age 0: 100%, 1day: 78%, 3days: 67%, 1week: 56%. All items start with base 1 point.`,
    "Karma Bonus (timeless)": `No time decay: min(karma^${postConfig.karmaSuperlinearExponent} / ${postConfig.karmaDivisor}, ${postConfig.karmaMaxBonus}). Used for personalized recommendations and author subscriptions. All items start with base 1 point.`,
    "Topic Affinity": `Bonus for posts on topics you read often (0-${postConfig.topicAffinityMaxBonus}, TODO)`,
  };
}

function getThreadComponentExplanations(settings?: ReturnType<typeof useUltraFeedSettings>['settings']): Record<string, string> {
  const config = getUserRankingConfig(settings);
  const threadConfig = config.threads;
  const postConfig = config.posts;
  const subscribedBonusSetting = settings?.resolverSettings?.unifiedScoring?.subscribedBonusSetting ?? 3;
  const bias = threadConfig.timeDecayBias;
  const scale = threadConfig.timeDecayScale;
  const multiplier = threadConfig.typeMultiplier;
  
  return {
    "Subscribed Comments": `Flat bonus per unread comment from authors you follow: subscribedBonusSetting × 2 = ${subscribedBonusSetting} × 2 = ${threadConfig.subscribedCommentBonus} per comment. Applies in addition to karma bonus. Configurable in settings (0-5, gives 0-10 per comment)`,
    "Prior Engagement": `+${threadConfig.engagementParticipationBonus} if commented, else +${threadConfig.engagementVotingBonus} if voted, else +${threadConfig.engagementViewingBonus} if viewed`,
    "Replies to You": `Someone replied to your comment (+${threadConfig.repliesToYouBonus}, TODO)`,
    "Your Post": `New comments on a post you wrote (+${threadConfig.yourPostBonus}, TODO)`,
    "Karma Bonus (time-decaying)": `Decay: min(sum(karma × ${scale}^0.25 / (ageHrs + ${bias})^0.25), ${threadConfig.karmaMaxBonus}) for ALL unread comments. Age 0: 100%, 1day: 78%, 3days: 67%, 1week: 56%. All items start with base 1 point.`,
    "Topic Affinity": `Bonus for threads on topics you read often (0-${postConfig.topicAffinityMaxBonus}) TODO`,
    "Quicktake": `Top-level comment is an unread quicktake (+${threadConfig.quicktakeBonus})`,
    "Read Post Context": `You've read the post, so you have context (+${threadConfig.readPostContextBonus})`,
  };
}


const ScoreComponent = ({ 
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
    <div className={classNames(classes.componentRow, rowClass)}>
      <span className={classes.componentName}>{name}</span>
      <span className={classNames(classes.componentValue, valueClass)}>
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
            <React.Fragment key={source}>
              <LWTooltip title={tooltip} placement="top">
                {tagContent}
              </LWTooltip>
              {!isLast && <span className={classes.sourceSeparator}>,</span>}
            </React.Fragment>
          );
        }
        
        return (
          <React.Fragment key={source}>
            {tagContent}
            {!isLast && <span className={classes.sourceSeparator}>,</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const PostScoreBreakdownContent = ({ breakdown, sources, metaInfo }: { breakdown: PostScoreBreakdown; sources?: FeedItemSourceType[]; metaInfo?: FeedPostMetaInfo }) => {
  const classes = useStyles(scoreBreakdownStyles);
  const { settings } = useUltraFeedSettings();
  const { components } = breakdown;
  
  // Determine which karma bonus type to display based on sources
  const isRecombeeOrSubscription = sources?.includes('recombee-lesswrong-custom') || sources?.includes('subscriptionsPosts');
  const karmaBonusLabel = isRecombeeOrSubscription ? "Karma Bonus (timeless)" : "Karma Bonus (time-decaying)";
  
  const allComponents = [
    { name: "Subscribed Author", value: components.subscribedBonus },
    { name: karmaBonusLabel, value: components.karmaBonus },
    { name: "Topic Affinity", value: components.topicAffinityBonus },
  ];
  
  const componentList = allComponents.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  const postExplanations = getPostComponentExplanations(settings);
  
  return (
    <>
      <SourcesSection sources={sources} metaInfo={metaInfo} itemType="post" />
      
      <div className={classes.totalScore}>
        Total Score: {formatScore(breakdown.total)}
      </div>
      
      <div className={classes.section}>
        {componentList.map(({ name, value }) => (
          <ScoreComponent key={name} name={name} value={value} explanations={postExplanations} />
        ))}
      </div>
      
      <LWTooltip 
        title={Math.abs(breakdown.typeMultiplier - 1) < 0.01 
          ? "No type multiplier applied (1.0×)"
          : `Posts are multiplied by ${breakdown.typeMultiplier}× to adjust their relative priority vs threads`
        }
        placement="left"
        inlineBlock={false}
        As="div"
      >
        <div className={classNames(classes.multiplier, {
          [classes.multiplierNoPenalty]: Math.abs(breakdown.typeMultiplier - 1) < 0.01
        })}>
          Type Multiplier: ×{formatScore(breakdown.typeMultiplier)}
        </div>
      </LWTooltip>
    </>
  );
};

export const ThreadScoreBreakdownContent = ({ breakdown, sources, metaInfo }: { breakdown: ThreadScoreBreakdown; sources?: FeedItemSourceType[]; metaInfo?: FeedCommentMetaInfo }) => {
  const classes = useStyles(scoreBreakdownStyles);
  const { settings } = useUltraFeedSettings();
  const { components, repetitionPenaltyMultiplier, typeMultiplier } = breakdown;
  
  const allComponents = [
    { name: "Subscribed Comments", value: components.unreadSubscribedCommentBonus },
    { name: "Prior Engagement", value: components.engagementContinuationBonus },
    { name: "Replies to You", value: components.repliesToYouBonus },
    { name: "Your Post", value: components.yourPostActivityBonus },
    { name: "Karma Bonus (time-decaying)", value: components.overallKarmaBonus },
    { name: "Topic Affinity", value: components.topicAffinityBonus },
    { name: "Quicktake", value: components.quicktakeBonus },
    { name: "Read Post Context", value: components.readPostContextBonus },
  ];
  
  const componentList = allComponents.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  const threadExplanations = getThreadComponentExplanations(settings);
  
  return (
    <>
      <SourcesSection sources={sources} metaInfo={metaInfo} itemType="commentThread" />
      
      <div className={classes.totalScore}>
        Total Score: {formatScore(breakdown.total)}
      </div>
      
      <div className={classes.section}>
        {componentList.map(({ name, value }) => (
          <ScoreComponent key={name} name={name} value={value} explanations={threadExplanations} />
        ))}
      </div>
      
      <LWTooltip 
        title={Math.abs(repetitionPenaltyMultiplier - 1) < 0.01 
          ? "No penalty is applied to this thread for having been shown recently"
          : "This item has been penalized since the same thread was already shown recently"
        }
        placement="left"
        inlineBlock={false}
        As="div"
      >
        <div className={classNames(classes.multiplier, {
          [classes.multiplierPenalty]: repetitionPenaltyMultiplier < 1,
          [classes.multiplierNoPenalty]: Math.abs(repetitionPenaltyMultiplier - 1) < 0.01
        })}>
          Repetition Penalty: ×{formatScore(repetitionPenaltyMultiplier)}
        </div>
      </LWTooltip>
      
      <LWTooltip 
        title={Math.abs(typeMultiplier - 1) < 0.01 
          ? "No type multiplier applied (1.0×)"
          : `Threads are multiplied by ${typeMultiplier}× to adjust their relative priority`
        }
        placement="left"
        inlineBlock={false}
        As="div"
      >
        <div className={classNames(classes.multiplier, {
          [classes.multiplierNoPenalty]: Math.abs(typeMultiplier - 1) < 0.01
        })}>
          Type Multiplier: ×{formatScore(typeMultiplier)}
        </div>
      </LWTooltip>
    </>
  );
};

