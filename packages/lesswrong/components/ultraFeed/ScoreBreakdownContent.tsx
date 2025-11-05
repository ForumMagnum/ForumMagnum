import React, { useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { PostScoreBreakdown, ThreadScoreBreakdown, FeedItemSourceType, FeedCommentMetaInfo, FeedPostMetaInfo } from './ultraFeedTypes';
import LWTooltip from '../common/LWTooltip';
import { DEFAULT_RANKING_CONFIG } from '../../server/ultraFeed/ultraFeedRankingConfig';
import AlterBonusesDialog from './AlterBonusesDialog';

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
    marginTop: 8,
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
    width: '100%',
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

const postConfig = DEFAULT_RANKING_CONFIG.posts;
const threadConfig = DEFAULT_RANKING_CONFIG.threads;

const sourceLabels: Record<FeedItemSourceType, string> = {
  'subscriptionsPosts': 'you follow the author',
  'subscriptionsComments': 'comments by authors you follow',
  'recombee-lesswrong-custom': 'personalized AI-recommendation based on reads and votes',
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

const postComponentExplanations: Record<string, string> = {
  "Starting Value": `Starting score for all posts (${postConfig.startingValue})`,
  "Subscribed Author": `Bonus for posts from authors you follow (+${postConfig.subscribedBonus}). Configurable in settings (0-25)`,
  "Karma Bonus": `For hacker-news posts: karma / (ageHrs + ${postConfig.hnDecayBias})^${postConfig.hnDecayFactor}. For recombee/subscription posts: min(karma^${postConfig.karmaSuperlinearExponent} / ${postConfig.karmaDivisor}, ${postConfig.karmaMaxBonus})`,
  "Topic Affinity": `Bonus for posts on topics you read often (0-${postConfig.topicAffinityMaxBonus}, TODO)`,
};

const threadComponentExplanations: Record<string, string> = {
  "Starting Value": `Starting score for all threads (${threadConfig.startingValue})`,
  "Subscribed Comments": `+${threadConfig.subscribedCommentBonus} per unread comment from authors you follow. No time decay applied. Configurable in settings (0-10 per comment)`,
  "Prior Engagement": `+${threadConfig.engagementParticipationBonus} if commented, else +${threadConfig.engagementVotingBonus} if voted, else +${threadConfig.engagementViewingBonus} if viewed`,
  "Replies to You": `Someone replied to your comment (+${threadConfig.repliesToYouBonus}, TODO)`,
  "Your Post": `New comments on a post you wrote (+${threadConfig.yourPostBonus}, TODO)`,
  "Karma Bonus": `HN-style decay for unread non-subscribed comments: sum((karma + 1) / (ageHrs + ${threadConfig.commentDecayBias})^${threadConfig.commentDecayFactor})`,
  "Topic Affinity": `Bonus for threads on topics you read often (0-${postConfig.topicAffinityMaxBonus}) TODO`,
  "Quicktake": `Top-level comment is an unread quicktake (+${threadConfig.quicktakeBonus})`,
  "Read Post Context": `You've read the post, so you have context (+${threadConfig.readPostContextBonus})`,
};


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
  const { components } = breakdown;
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const allComponents = [
    { name: "Starting Value", value: components.startingValue, isBase: true },
    { name: "Subscribed Author", value: components.subscribedBonus, isBase: false },
    { name: "Karma Bonus", value: components.karmaBonus, isBase: false },
    { name: "Topic Affinity", value: components.topicAffinityBonus, isBase: false },
  ];
  
  const baseScore = allComponents.find(c => c.isBase);
  const otherComponents = allComponents
    .filter(c => !c.isBase)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  const componentList = baseScore ? [baseScore, ...otherComponents] : otherComponents;
  
  return (
    <div className={classes.tooltipContent}>
      <SourcesSection sources={sources} metaInfo={metaInfo} itemType="post" />
      
      <div className={classes.totalScore}>
        Total Score: {formatScore(breakdown.total)}
      </div>
      
      <div className={classes.section}>
        {componentList.map(({ name, value }) => (
          <ScoreComponent key={name} name={name} value={value} explanations={postComponentExplanations} />
        ))}
      </div>
      
      <button 
        className={classes.alterBonusesButton}
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
      >
        Alter Bonuses
      </button>
      
      <AlterBonusesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        className={classes.alterBonusesDialogWrapper}
      />
    </div>
  );
};

export const ThreadScoreBreakdownContent = ({ breakdown, sources, metaInfo }: { breakdown: ThreadScoreBreakdown; sources?: FeedItemSourceType[]; metaInfo?: FeedCommentMetaInfo }) => {
  const classes = useStyles(scoreBreakdownStyles);
  const { components, repetitionPenaltyMultiplier } = breakdown;
  
  const allComponents = [
    { name: "Starting Value", value: components.startingValue, isBase: true },
    { name: "Subscribed Comments", value: components.unreadSubscribedCommentBonus, isBase: false },
    { name: "Prior Engagement", value: components.engagementContinuationBonus, isBase: false },
    { name: "Replies to You", value: components.repliesToYouBonus, isBase: false },
    { name: "Your Post", value: components.yourPostActivityBonus, isBase: false },
    { name: "Karma Bonus", value: components.overallKarmaBonus, isBase: false },
    { name: "Topic Affinity", value: components.topicAffinityBonus, isBase: false },
    { name: "Quicktake", value: components.quicktakeBonus, isBase: false },
    { name: "Read Post Context", value: components.readPostContextBonus, isBase: false },
  ];
  
  const baseScore = allComponents.find(c => c.isBase);
  const otherComponents = allComponents
    .filter(c => !c.isBase)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  const componentList = baseScore ? [baseScore, ...otherComponents] : otherComponents;
  
  return (
    <div className={classes.tooltipContent}>
      <SourcesSection sources={sources} metaInfo={metaInfo} itemType="commentThread" />
      
      <div className={classes.totalScore}>
        Total Score: {formatScore(breakdown.total)}
      </div>
      
      <div className={classes.section}>
        {componentList.map(({ name, value }) => (
          <ScoreComponent key={name} name={name} value={value} explanations={threadComponentExplanations} />
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
    </div>
  );
};

