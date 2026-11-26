import React from 'react';
import classNames from 'classnames';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { visitorScenarioOptions, type PostsListDebugSettings } from './postsListDebugContext';
import type { PostsItemConfig } from './usePostsItem';

const FrontpagePostScoreBreakdownQuery = gql(`
  query FrontpagePostScoreBreakdown($postId: String!, $filterSettings: JSON!, $activityFactorOverride: Float) {
    FrontpagePostScoreBreakdown(postId: $postId, filterSettings: $filterSettings, activityFactorOverride: $activityFactorOverride) {
      filteredScore
      additiveTerms {
        label
        value
      }
      multiplicativeTerms {
        label
        value
      }
      ageHours
      ageOffsetHours
      decayExponent
      decayDivisor
      activityFactor
    }
  }
`);

const styles = defineStyles('PostsListDebugRow', (theme: ThemeType) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: '52px minmax(0, 1fr)',
    alignItems: 'center',
  },
  score: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.primary.main,
    textAlign: 'right',
    paddingRight: 8,
    cursor: 'default',
  },
  notRankedByScore: {
    color: theme.palette.text.dim,
    fontWeight: 400,
  },
  tooltip: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 3,
    boxShadow: theme.palette.boxShadow.lwCard,
  },
  tooltipContent: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: '12px 16px',
    minWidth: 260,
    maxWidth: 400,
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  total: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
    color: theme.palette.text.primary,
  },
  note: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 600,
    marginTop: 8,
    marginBottom: 2,
    color: theme.palette.text.primary,
  },
  termRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
  },
  identityTerm: {
    opacity: 0.5,
  },
  activityFactorSource: {
    fontStyle: 'italic',
    textAlign: 'right',
  },
}));

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getActivityFactorSource(settings: PostsListDebugSettings): string {
  if (settings.scenario === "actual") {
    return "From your visit history";
  }
  const scenarioLabel = visitorScenarioOptions.find(option => option.value === settings.scenario)?.label;
  return `Simulated: ${scenarioLabel}`;
}

const TermRow = ({ label, value, isIdentity }: { label: string, value: string, isIdentity?: boolean }) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.termRow, { [classes.identityTerm]: isIdentity })}>
    <span>{label}</span>
    <span>{value}</span>
  </div>;
};

const ScoreBreakdownTooltip = ({ breakdown, notes, settings }: {
  breakdown: FrontpagePostScoreBreakdownQuery_FrontpagePostScoreBreakdown_FrontpagePostScoreBreakdown,
  notes: string[],
  settings: PostsListDebugSettings,
}) => {
  const classes = useStyles(styles);
  const { additiveTerms, multiplicativeTerms, ageHours, ageOffsetHours, decayExponent, decayDivisor, activityFactor } = breakdown;

  return <div className={classes.tooltipContent}>
    <div className={classes.total}>Score: {breakdown.filteredScore.toPrecision(3)}</div>
    {notes.map(note => <div key={note} className={classes.note}>{note}</div>)}

    <div className={classes.sectionTitle}>Sum of</div>
    {additiveTerms.map(({ label, value }) =>
      <TermRow key={label} label={label} value={formatNumber(value)} isIdentity={value === 0} />
    )}

    {multiplicativeTerms.length > 0 && <>
      <div className={classes.sectionTitle}>Multiplied by</div>
      {multiplicativeTerms.map(({ label, value }) =>
        <TermRow key={label} label={label} value={`×${formatNumber(value)}`} isIdentity={value === 1} />
      )}
    </>}

    <div className={classes.sectionTitle}>Divided by time decay</div>
    <TermRow label="Age" value={`${ageHours.toFixed(1)} hours`} />
    <TermRow label={`(age + ${formatNumber(ageOffsetHours)})^${decayExponent.toFixed(3)}`} value={`÷${formatNumber(decayDivisor)}`} />
    {activityFactor === null
      ? <div className={classes.activityFactorSource}>Not adjusted for visit frequency</div>
      : <>
        <TermRow label="Activity factor" value={activityFactor.toFixed(3)} />
        <div className={classes.activityFactorSource}>{getActivityFactorSource(settings)}</div>
      </>}
  </div>;
};

function getPlacementNotes({ post, recombeeRecommId, curatedIconLeft }: PostsItemConfig): string[] {
  return [
    ...(recombeeRecommId ? ["Recommended by Recombee; its position doesn't come from this score."] : []),
    ...(curatedIconLeft ? ["Shown in the curated slot; its position doesn't come from this score."] : []),
    ...(post.sticky ? ["Stickied; shown above unstickied posts regardless of score."] : []),
  ];
}

const PostsListDebugScore = ({ item, settings }: {
  item: PostsItemConfig,
  settings: PostsListDebugSettings,
}) => {
  const classes = useStyles(styles);
  const { data } = useQuery(FrontpagePostScoreBreakdownQuery, {
    variables: {
      postId: item.post._id,
      filterSettings: settings.filterSettings,
      activityFactorOverride: settings.activityFactorOverride,
    },
  });
  const breakdown = data?.FrontpagePostScoreBreakdown;
  if (!breakdown) {
    return <div className={classes.score}>n/a</div>;
  }

  const notes = getPlacementNotes(item);
  return <LWTooltip
    title={<ScoreBreakdownTooltip breakdown={breakdown} notes={notes} settings={settings} />}
    placement="right-start"
    popperClassName={classes.tooltip}
    clickable
  >
    <div className={classNames(classes.score, { [classes.notRankedByScore]: notes.length > 0 })}>
      {breakdown.filteredScore.toPrecision(3)}
    </div>
  </LWTooltip>;
};

const PostsListDebugRow = ({ item, settings, children }: {
  item: PostsItemConfig,
  settings: PostsListDebugSettings,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root}>
    <SuspenseWrapper name="PostsListDebugScore" fallback={<div className={classes.score}>…</div>}>
      <PostsListDebugScore item={item} settings={settings} />
    </SuspenseWrapper>
    {children}
  </div>;
};

export default PostsListDebugRow;
