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
import { Link } from '@/lib/reactRouterWrapper';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { useForumType } from '../hooks/useForumType';
import { useFilterSettings } from '../hooks/useFilterSettings';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
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
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import Error404 from '../common/Error404';
import Loading from '../vulcan-core/Loading';

const FrontpageAlgorithmPostsMultiQuery = gql(`
  query multiPostFrontpageAlgorithmTuningPageQuery($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit, enableTotal: false) {
      results {
        ...PostsBase
      }
    }
  }
`);

const POSTS_LIMIT = 40;

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

type RankedPost = PostsBase & { rank: number };

const styles = defineStyles("FrontpageAlgorithmTuningPage", (theme: ThemeType) => ({
  root: {
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
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr",
    },
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 8,
  },
  row: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    fontSize: 13,
    padding: "4px 0",
    borderBottom: theme.palette.greyBorder("1px", 0.08),
  },
  rank: {
    width: 22,
    textAlign: "right",
    color: theme.palette.text.dim,
    flexShrink: 0,
  },
  delta: {
    width: 34,
    flexShrink: 0,
    fontSize: 12,
  },
  movedUp: {
    color: theme.palette.text.charsAdded,
  },
  movedDown: {
    color: theme.palette.text.charsRemoved,
  },
  title: {
    flexGrow: 1,
    color: theme.palette.text.normal,
  },
  meta: {
    flexShrink: 0,
    color: theme.palette.text.dim,
    fontSize: 12,
  },
}));

const parseOverrides = (source: ParamDrafts): AlgorithmOverrides =>
  Object.fromEntries(algorithmParams.flatMap(({ key }) => {
    const value = parseFloat(source[key] ?? "");
    return Number.isFinite(value) ? [[key, value]] : [];
  }));

const overridesToDrafts = (overrides: AlgorithmOverrides): ParamDrafts =>
  Object.fromEntries(algorithmParams.map(({ key }) => [key, overrides[key]?.toString() ?? ""]));

const formatAge = (postedAt: string, now: Date): string => {
  const hours = moment(now).diff(moment(postedAt), "hours");
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
};

const formatExponent = (exponent: number) => exponent.toFixed(3);

const RankDelta = ({ post, defaultRanks }: { post: RankedPost, defaultRanks: Map<string, number> }) => {
  const classes = useStyles(styles);
  const defaultRank = defaultRanks.get(post._id);
  if (defaultRank === undefined) {
    return <span className={classNames(classes.delta, classes.movedUp)}>new</span>;
  }
  const delta = defaultRank - post.rank;
  if (delta === 0) {
    return <span className={classes.delta}>–</span>;
  }
  return <span className={classNames(classes.delta, delta > 0 ? classes.movedUp : classes.movedDown)}>
    {delta > 0 ? `▲${delta}` : `▼${-delta}`}
  </span>;
};

const PostRow = ({ post, now, defaultRanks }: {
  post: RankedPost,
  now: Date,
  defaultRanks: Map<string, number>|null,
}) => {
  const classes = useStyles(styles);
  const markers = [
    post.curatedDate ? "curated" : null,
    post.frontpageDate ? null : "personal",
  ].filter(Boolean).join(", ");
  return <div className={classes.row}>
    <span className={classes.rank}>{post.rank}</span>
    {defaultRanks && <RankDelta post={post} defaultRanks={defaultRanks} />}
    <Link to={postGetPageUrl(post)} className={classes.title}>{post.title}</Link>
    <span className={classes.meta}>
      {post.baseScore} karma · {formatAge(post.postedAt, now)}{markers && ` · ${markers}`}
    </span>
  </div>;
};

const PostsColumn = ({ title, posts, loading, now, defaultRanks }: {
  title: string,
  posts: RankedPost[],
  loading: boolean,
  now: Date,
  defaultRanks: Map<string, number>|null,
}) => {
  const classes = useStyles(styles);
  return <div>
    <div className={classes.columnTitle}>{title}</div>
    {loading
      ? <Loading />
      : posts.map((post) => <PostRow key={post._id} post={post} now={now} defaultRanks={defaultRanks} />)
    }
  </div>;
};

const withRanks = (posts: PostsBase[] | undefined): RankedPost[] =>
  (posts ?? []).map((post, index) => ({ ...post, rank: index + 1 }));

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
    variables: { selector: { magic: baseSelector }, limit: POSTS_LIMIT },
    skip: !isAdmin,
  });
  const { data: tweakedData, loading: tweakedLoading } = useQuery(FrontpageAlgorithmPostsMultiQuery, {
    variables: { selector: { magic: { ...baseSelector, ...overrides } }, limit: POSTS_LIMIT },
    skip: !isAdmin,
  });

  if (!isAdmin) {
    return <Error404 />;
  }

  const defaultPosts = withRanks(defaultData?.posts?.results);
  const tweakedPosts = withRanks(tweakedData?.posts?.results);
  const defaultRanks = new Map(defaultPosts.map((post) => [post._id, post.rank]));

  const applyOverrides = (newOverrides: AlgorithmOverrides) => {
    setDrafts(overridesToDrafts(newOverrides));
    navigate({ search: qs.stringify(newOverrides) }, { replace: true });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyOverrides(parseOverrides(drafts));
  };

  return <SingleColumnSection className={classes.root}>
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
      <PostsColumn title="Current defaults" posts={defaultPosts} loading={defaultLoading} now={now} defaultRanks={null} />
      <PostsColumn title="With your parameters" posts={tweakedPosts} loading={tweakedLoading} now={now} defaultRanks={defaultRanks} />
    </div>
  </SingleColumnSection>;
};

export default FrontpageAlgorithmTuningPage;
