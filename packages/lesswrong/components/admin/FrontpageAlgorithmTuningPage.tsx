"use client";

import React, { useState } from 'react';
import moment from 'moment';
import qs from 'qs';
import classNames from 'classnames';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { useForumType } from '../hooks/useForumType';
import { useFilterSettings } from '../hooks/useFilterSettings';
import { getFrontpageTimeDecayFactor } from '@/lib/scoring';
import {
  curatedScoreBonus,
  defaultActivityHalfLife,
  defaultActivityWeight,
  defaultDecayFactorFastest,
  defaultDecayFactorSlowest,
  defaultStartingAgeHours,
  frontpageDaysAgoCutoffSetting,
} from '@/lib/instanceSettings';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import SectionTitle from '../common/SectionTitle';
import Error404 from '../common/Error404';
import Loading from '../vulcan-core/Loading';
import PostsItem from '../posts/PostsItem';
import { latestPostsDefaultLimit } from '../common/LWHomePosts';

const FrontpageAlgorithmPostsMultiQuery = gql(`
  query multiPostFrontpageAlgorithmTuningPageQuery($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit, enableTotal: false) {
      results {
        ...PostsListWithVotes
      }
    }
  }
`);

const latestPostsTerms: PostsViewTerms = { view: "magic", forum: true };

type AlgorithmParamKey =
  | "algoStartingAgeHours"
  | "algoDecayFactorSlowest"
  | "algoDecayFactorFastest"
  | "algoActivityWeight"
  | "algoActivityHalfLifeHours"
  | "algoActivityFactor";

interface AlgorithmParam {
  key: AlgorithmParamKey
  label: string
  defaultValue: number|null
  description: string
}

const algorithmParams: AlgorithmParam[] = [
  {
    key: "algoStartingAgeHours",
    label: "Starting age (hours)",
    defaultValue: defaultStartingAgeHours,
    description: "Added to every post's age, so brand-new posts don't get an unbounded score.",
  },
  {
    key: "algoDecayFactorSlowest",
    label: "Decay exponent (slowest)",
    defaultValue: defaultDecayFactorSlowest,
    description: "Exponent used for a visitor with no recent activity.",
  },
  {
    key: "algoDecayFactorFastest",
    label: "Decay exponent (fastest)",
    defaultValue: defaultDecayFactorFastest,
    description: "Upper bound on the exponent, reached by very active visitors.",
  },
  {
    key: "algoActivityWeight",
    label: "Activity weight",
    defaultValue: defaultActivityWeight,
    description: "How strongly recent activity speeds up decay.",
  },
  {
    key: "algoActivityHalfLifeHours",
    label: "Activity half-life (hours)",
    defaultValue: defaultActivityHalfLife,
    description: "How quickly past visits stop counting towards activity.",
  },
  {
    key: "algoActivityFactor",
    label: "Activity factor override",
    defaultValue: null,
    description: "0 = inactive, 1 = visited every hour. Leave blank to use your own recent activity.",
  },
];

type AlgorithmOverrides = Partial<Record<AlgorithmParamKey, number>>;

type ParamDrafts = Partial<Record<AlgorithmParamKey, string>>;

const styles = defineStyles("FrontpageAlgorithmTuningPage", (theme: ThemeType) => ({
  root: {
    maxWidth: 1500,
    margin: "0 auto",
    padding: "0 16px",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.dim,
    marginBottom: 16,
    "& code": {
      background: theme.palette.greyAlpha(0.05),
      padding: "1px 4px",
      borderRadius: 3,
    },
  },
  params: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  paramLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
  paramDescription: {
    fontSize: 12,
    color: theme.palette.text.dim,
    marginTop: 4,
  },
  input: {
    width: "100%",
  },
  buttons: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  exponentSummary: {
    fontSize: 13,
    marginBottom: 24,
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 32,
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 8,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  itemPost: {
    flexGrow: 1,
    minWidth: 0,
  },
  delta: {
    width: 34,
    flexShrink: 0,
    fontSize: 12,
    textAlign: "right",
  },
  movedUp: {
    color: theme.palette.text.charsAdded,
  },
  movedDown: {
    color: theme.palette.text.charsRemoved,
  },
}));

const parseOverrides = (source: ParamDrafts): AlgorithmOverrides =>
  Object.fromEntries(algorithmParams.flatMap(({ key }) => {
    const value = parseFloat(source[key] ?? "");
    return Number.isFinite(value) ? [[key, value]] : [];
  }));

const overridesToDrafts = (overrides: AlgorithmOverrides): ParamDrafts =>
  Object.fromEntries(algorithmParams.map(({ key }) => [key, overrides[key]?.toString() ?? ""]));

const formatExponent = (exponent: number) => exponent.toFixed(3);

const RankDelta = ({ postId, rank, defaultRanks }: { postId: string, rank: number, defaultRanks: Map<string, number> }) => {
  const classes = useStyles(styles);
  const defaultRank = defaultRanks.get(postId);
  if (defaultRank === undefined) {
    return <span className={classNames(classes.delta, classes.movedUp)}>new</span>;
  }
  const delta = defaultRank - rank;
  if (delta === 0) {
    return <span className={classes.delta}>–</span>;
  }
  return <span className={classNames(classes.delta, delta > 0 ? classes.movedUp : classes.movedDown)}>
    {delta > 0 ? `▲${delta}` : `▼${-delta}`}
  </span>;
};

const PostsColumn = ({ title, posts, loading, defaultRanks }: {
  title: string,
  posts: PostsListWithVotes[],
  loading: boolean,
  defaultRanks: Map<string, number>|null,
}) => {
  const classes = useStyles(styles);
  return <div>
    <div className={classes.columnTitle}>{title}</div>
    {loading
      ? <Loading />
      : posts.map((post, index) => <div key={post._id} className={classes.item}>
        {defaultRanks && <RankDelta postId={post._id} rank={index + 1} defaultRanks={defaultRanks} />}
        <div className={classes.itemPost}>
          <PostsItem post={post} terms={latestPostsTerms} />
        </div>
      </div>)
    }
  </div>;
};

const ExponentSummary = ({ overrides }: { overrides: AlgorithmOverrides }) => {
  const classes = useStyles(styles);
  const params = {
    decayFactorSlowest: overrides.algoDecayFactorSlowest ?? defaultDecayFactorSlowest,
    decayFactorFastest: overrides.algoDecayFactorFastest ?? defaultDecayFactorFastest,
    activityWeight: overrides.algoActivityWeight ?? defaultActivityWeight,
  };
  const activityOverride = overrides.algoActivityFactor;
  return <div className={classes.exponentSummary}>
    Effective decay exponent: {formatExponent(getFrontpageTimeDecayFactor(params, 0))} for an inactive visitor,
    {" "}{formatExponent(getFrontpageTimeDecayFactor(params, 1))} for a maximally active visitor
    {activityOverride !== undefined && <>
      , {formatExponent(getFrontpageTimeDecayFactor(params, activityOverride))} at the overridden activity factor of {activityOverride}
    </>}.
  </div>;
};

const FrontpageAlgorithmTuningPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { forumType } = useForumType();
  const { filterSettings } = useFilterSettings();
  const now = useCurrentTime();
  const { query } = useLocation();
  const navigate = useNavigate();

  const overrides = parseOverrides(query);
  const [drafts, setDrafts] = useState<ParamDrafts>(() => overridesToDrafts(overrides));

  const isAdmin = userIsAdmin(currentUser);
  const after = moment(now).subtract(frontpageDaysAgoCutoffSetting.get(forumType) * 24, "hours").startOf("hour").toISOString();
  const baseSelector = { filterSettings, after, forum: true };

  const { data: defaultData, loading: defaultLoading } = useQuery(FrontpageAlgorithmPostsMultiQuery, {
    variables: { selector: { magic: baseSelector }, limit: latestPostsDefaultLimit },
    skip: !isAdmin,
  });
  const { data: tweakedData, loading: tweakedLoading } = useQuery(FrontpageAlgorithmPostsMultiQuery, {
    variables: { selector: { magic: { ...baseSelector, ...overrides } }, limit: latestPostsDefaultLimit },
    skip: !isAdmin,
  });

  if (!isAdmin) {
    return <Error404 />;
  }

  const defaultPosts = defaultData?.posts?.results ?? [];
  const tweakedPosts = tweakedData?.posts?.results ?? [];
  const defaultRanks = new Map(defaultPosts.map((post, index) => [post._id, index + 1]));

  const applyOverrides = (newOverrides: AlgorithmOverrides) => {
    setDrafts(overridesToDrafts(newOverrides));
    navigate({ search: qs.stringify(newOverrides) }, { replace: true });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyOverrides(parseOverrides(drafts));
  };

  return <div className={classes.root}>
    <SectionTitle title="Frontpage Algorithm Tuning" noTopMargin />
    <div className={classes.explanation}>
      Latest Posts are sorted by <code>(karma + bonuses) / (ageInHours + startingAge) ^ exponent</code>, where
      the exponent is <code>min(slowest × (1 + activityWeight × activityFactor), fastest)</code>. Curated posts
      get a +{curatedScoreBonus} karma bonus, and your own tag filter settings are applied. Overrides only affect
      this page; blank fields use the current defaults. Both lists include curated posts, which the real frontpage
      pulls out into the curated section above Latest Posts.
    </div>
    <form onSubmit={onSubmit}>
      <div className={classes.params}>
        {algorithmParams.map(({ key, label, defaultValue, description }) => <div key={key}>
          <div className={classes.paramLabel}>{label}</div>
          <Input
            className={classes.input}
            type="number"
            inputProps={{ step: "any" }}
            placeholder={defaultValue === null ? "your activity" : `${defaultValue} (default)`}
            value={drafts[key] ?? ""}
            onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
          />
          <div className={classes.paramDescription}>{description}</div>
        </div>)}
      </div>
      <div className={classes.buttons}>
        <Button type="submit" variant="contained" color="primary">Apply</Button>
        <Button onClick={() => applyOverrides({})}>Reset to defaults</Button>
      </div>
    </form>
    <ExponentSummary overrides={overrides} />
    <div className={classes.columns}>
      <PostsColumn title="Current defaults" posts={defaultPosts} loading={defaultLoading} defaultRanks={null} />
      <PostsColumn title="With your parameters" posts={tweakedPosts} loading={tweakedLoading} defaultRanks={defaultRanks} />
    </div>
  </div>;
};

export default FrontpageAlgorithmTuningPage;
