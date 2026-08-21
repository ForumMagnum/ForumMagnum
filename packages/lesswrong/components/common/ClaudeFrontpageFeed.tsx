'use client';

import React, { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import ArrowUpwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowUpward';
import {
  ClaudeFeedItem,
  ClaudeFeedItemType,
  ClaudeFeedModelId,
  ClaudeFeedStoredRun,
  ClaudeFeedUsage,
  claudeFeedModelConfigs,
  claudeFeedModelIds,
  claudeFeedProfileResponseSchema,
  claudeFeedResponseSchema,
  claudeFeedStoredHistorySchema,
  defaultClaudeFeedModel,
} from '@/lib/claudeFeed';
import { useTracking } from '@/lib/analyticsEvents';
import { ClaudeSparkIcon } from '@/components/icons/claudeSparkIcon';
import LWTooltip from '@/components/common/LWTooltip';
import { useCurrentUser } from '@/components/common/withUser';
import {
  getBrowserLocalStorage,
  safeStorageGetItem,
  safeStorageSetItem,
} from '@/components/editor/localStorageHandlers';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import FeedItemWrapper from '@/components/ultraFeed/FeedItemWrapper';
import UltraFeedPostItem from '@/components/ultraFeed/UltraFeedPostItem';
import UltraFeedThreadItem from '@/components/ultraFeed/UltraFeedThreadItem';
import UltraFeedWrappers from '@/components/ultraFeed/UltraFeedWrappers';
import { useUltraFeedSettings } from '@/components/hooks/useUltraFeedSettings';
import TagPreview from '@/components/tagging/TagPreview';
import type {
  DisplayFeedCommentThread,
  FeedCommentMetaInfo,
  FeedPostMetaInfo,
} from '@/components/ultraFeed/ultraFeedTypes';
import type { UltraFeedSettingsType } from '@/components/ultraFeed/ultraFeedSettingsTypes';

type FeedFilter = 'all' | ClaudeFeedItemType;

interface FilterOption {
  value: FeedFilter;
  label: string;
}

interface ClaudeFeedApiResponse {
  items: ClaudeFeedItem[];
  model: ClaudeFeedModelId;
  usage: ClaudeFeedUsage;
  costUsd: number;
  costIsEstimated: boolean;
}

interface ClaudeProfileApiResponse {
  profile: string;
  model: ClaudeFeedModelId;
  usage: ClaudeFeedUsage;
  costUsd: number;
  costIsEstimated: boolean;
}

const RUN_HISTORY_STORAGE_VERSION = 1;
const MAX_STORED_RUNS = 50;

const filterOptions: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'post', label: 'Posts' },
  { value: 'comment', label: 'Comments' },
  { value: 'wiki', label: 'Wiki' },
];

const ClaudeFrontpageFeedDocumentsQuery = gql(`
  query ClaudeFrontpageFeedDocuments($postIds: [String!], $commentIds: [String!], $tagIds: [String!]!, $limit: Int) {
    posts(selector: { default: { exactPostIds: $postIds } }, limit: $limit) {
      results {
        ...PostsListWithVotes
      }
    }
    comments(selector: { default: { commentIds: $commentIds } }, limit: $limit) {
      results {
        ...UltraFeedComment
      }
    }
    tags(selector: { tagsByTagIds: { tagIds: $tagIds } }, limit: $limit) {
      results {
        ...TagPreviewFragment
      }
    }
  }
`);

const styles = defineStyles('ClaudeFrontpageFeed', (theme: ThemeType) => ({
  root: {
    minHeight: '65vh',
    marginTop: 4,
    marginBottom: 80,
  },
  promptForm: {
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr) 44px',
    gap: 12,
    alignItems: 'center',
    padding: '12px 12px 12px 16px',
    border: theme.palette.greyBorder('1px', 0.16),
    borderRadius: 14,
    background: theme.palette.panelBackground.default,
    boxShadow: `0 8px 30px ${theme.palette.boxShadowColor(0.07)}`,
    transition: 'border-color 160ms ease, box-shadow 160ms ease',
    '&:focus-within': {
      borderColor: theme.palette.lwTertiary.main,
      boxShadow: `0 10px 34px ${theme.palette.boxShadowColor(0.11)}`,
    },
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: '26px minmax(0, 1fr) 40px',
      gap: 8,
      paddingLeft: 12,
    },
  },
  claudeIcon: {
    width: 24,
    height: 24,
    color: theme.palette.lwTertiary.main,
    opacity: 0.82,
  },
  promptInput: {
    width: '100%',
    minHeight: 50,
    maxHeight: 160,
    padding: '13px 0 8px',
    border: 0,
    outline: 0,
    resize: 'vertical',
    background: 'transparent',
    color: theme.palette.text.normal,
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.13rem',
    lineHeight: 1.45,
    '&::placeholder': {
      color: theme.palette.text.dim,
      opacity: 0.75,
    },
  },
  submitButton: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 0,
    borderRadius: '50%',
    color: theme.palette.panelBackground.default,
    background: theme.palette.lwTertiary.main,
    cursor: 'pointer',
    transition: 'transform 140ms ease, opacity 140ms ease',
    '&:hover': {
      transform: 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.lwTertiary.main}`,
      outlineOffset: 3,
    },
    '&:disabled': {
      cursor: 'default',
      opacity: 0.38,
      transform: 'none',
    },
  },
  submitIcon: {
    width: 21,
    height: 21,
  },
  submitIconLoading: {
    animation: '$claudeFeedTurn 900ms linear infinite',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    padding: '0 2px',
    [theme.breakpoints.down('xs')]: {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
  primaryControls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    minHeight: 32,
    padding: '6px 11px',
    border: theme.palette.greyBorder('1px', 0.18),
    borderRadius: 6,
    background: 'transparent',
    color: theme.palette.text.slightlyDim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.78rem',
    lineHeight: 1.2,
    cursor: 'pointer',
    transition: 'border-color 120ms ease, color 120ms ease, background 120ms ease',
    '&:hover': {
      borderColor: theme.palette.lwTertiary.main,
      color: theme.palette.text.normal,
      background: theme.palette.greyAlpha(0.025),
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.lwTertiary.main}`,
      outlineOffset: 2,
    },
    '&:disabled': {
      cursor: 'default',
      opacity: 0.48,
    },
  },
  modelSelect: {
    minHeight: 32,
    maxWidth: 220,
    padding: '5px 28px 5px 9px',
    border: theme.palette.greyBorder('1px', 0.18),
    borderRadius: 6,
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.slightlyDim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.78rem',
    cursor: 'pointer',
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.lwTertiary.main}`,
      outlineOffset: 2,
    },
  },
  spendButton: {
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    [theme.breakpoints.down('xs')]: {
      alignSelf: 'flex-start',
    },
  },
  profilePanel: {
    marginTop: 10,
    padding: '11px 13px 10px',
    borderLeft: `3px solid ${theme.palette.lwTertiary.main}`,
    borderRadius: '0 7px 7px 0',
    background: theme.palette.greyAlpha(0.028),
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 5,
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  profileInput: {
    width: '100%',
    minHeight: 64,
    padding: 0,
    border: 0,
    outline: 0,
    resize: 'vertical',
    background: 'transparent',
    color: theme.palette.text.normal,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.86rem',
    lineHeight: 1.45,
  },
  profileStatus: {
    marginTop: 8,
    color: theme.palette.error.main,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.8rem',
  },
  historyTooltip: {
    background: 'transparent',
    boxShadow: 'none',
  },
  historyPanel: {
    width: 350,
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 420,
    overflowY: 'auto',
    border: theme.palette.greyBorder('1px', 0.16),
    borderRadius: 8,
    background: theme.palette.panelBackground.default,
    boxShadow: `0 12px 34px ${theme.palette.boxShadowColor(0.18)}`,
  },
  historyHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    padding: '11px 12px 9px',
    borderBottom: theme.palette.greyBorder('1px', 0.1),
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  historyRun: {
    width: '100%',
    display: 'block',
    padding: '10px 12px',
    border: 0,
    borderBottom: theme.palette.greyBorder('1px', 0.08),
    background: 'transparent',
    color: theme.palette.text.normal,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.greyAlpha(0.035),
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.lwTertiary.main}`,
      outlineOffset: -2,
    },
  },
  historyRunTitle: {
    display: 'block',
    overflow: 'hidden',
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.82rem',
    lineHeight: 1.3,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  historyRunMeta: {
    display: 'block',
    marginTop: 3,
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.7rem',
    fontVariantNumeric: 'tabular-nums',
  },
  historyEmpty: {
    padding: 14,
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.8rem',
  },
  filterRail: {
    display: 'flex',
    gap: 22,
    marginTop: 14,
    borderBottom: theme.palette.greyBorder('1px', 0.11),
    [theme.breakpoints.down('xs')]: {
      gap: 18,
    },
  },
  filterButton: {
    position: 'relative',
    padding: '8px 1px 11px',
    border: 0,
    background: 'transparent',
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.92rem',
    cursor: 'pointer',
    '&:after': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -1,
      height: 2,
      background: 'transparent',
    },
    '&:hover': {
      color: theme.palette.text.normal,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.lwTertiary.main}`,
      outlineOffset: 2,
    },
  },
  filterButtonActive: {
    color: theme.palette.text.normal,
    '&:after': {
      background: theme.palette.lwTertiary.main,
    },
  },
  results: {
    marginTop: 2,
  },
  nativeItem: {
    position: 'relative',
  },
  wikiItem: {
    overflow: 'hidden',
    borderRadius: 4,
    background: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    '& .TagPreview-root': {
      width: '100%',
    },
  },
  reasonButton: {
    position: 'absolute',
    zIndex: 2,
    top: 12,
    right: -30,
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    padding: 0,
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: '50%',
    background: 'transparent',
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.72rem',
    cursor: 'help',
    opacity: 0.72,
    '&:hover': {
      borderColor: theme.palette.lwTertiary.main,
      color: theme.palette.lwTertiary.main,
      opacity: 1,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.lwTertiary.main}`,
      outlineOffset: 2,
    },
    [theme.breakpoints.down('sm')]: {
      top: 8,
      right: 42,
      background: theme.palette.panelBackground.default,
    },
  },
  status: {
    marginTop: 16,
    color: theme.palette.text.dim,
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.9rem',
  },
  error: {
    color: theme.palette.error.main,
  },
  skeletonItem: {
    display: 'grid',
    gridTemplateColumns: '34px minmax(0, 1fr)',
    gap: 12,
    padding: '24px 4px 25px 0',
    borderBottom: theme.palette.greyBorder('1px', 0.08),
  },
  skeletonRank: {
    width: 13,
    height: 8,
    marginTop: 4,
    borderRadius: 3,
    background: theme.palette.greyAlpha(0.09),
    animation: '$claudeFeedPulse 1.25s ease-in-out infinite',
  },
  skeletonBody: {
    display: 'grid',
    gap: 9,
  },
  skeletonLine: {
    width: '72%',
    height: 12,
    borderRadius: 4,
    background: theme.palette.greyAlpha(0.09),
    animation: '$claudeFeedPulse 1.25s ease-in-out infinite',
  },
  skeletonLineShort: {
    width: '38%',
    height: 8,
  },
  '@keyframes claudeFeedTurn': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  '@keyframes claudeFeedPulse': {
    '0%, 100%': { opacity: 0.45 },
    '50%': { opacity: 1 },
  },
  '@media (prefers-reduced-motion: reduce)': {
    submitButton: {
      transition: 'none',
    },
    submitIconLoading: {
      animation: 'none',
    },
    skeletonRank: {
      animation: 'none',
    },
    skeletonLine: {
      animation: 'none',
    },
  },
}));

function getTypeLabel(type: ClaudeFeedItemType): string {
  if (type === 'post') {
    return 'Post';
  }
  if (type === 'comment') {
    return 'Comment';
  }
  return 'Wiki';
}

function getErrorMessage(body: unknown, fallback: string): string {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
  ) ? body.error : fallback;
}

function getRunHistoryStorageKey(userId: string | undefined): string {
  return `claudeFrontpageFeedRuns:${userId ?? 'guest'}`;
}

function readStoredRuns(storageKey: string): ClaudeFeedStoredRun[] {
  const storage = getBrowserLocalStorage();
  const storedValue = safeStorageGetItem(storage, storageKey);
  if (!storedValue) {
    return [];
  }
  try {
    const parsedHistory = claudeFeedStoredHistorySchema.safeParse(JSON.parse(storedValue));
    return parsedHistory.success ? parsedHistory.data.runs : [];
  } catch {
    return [];
  }
}

function writeStoredRuns(storageKey: string, runs: ClaudeFeedStoredRun[]): void {
  safeStorageSetItem(getBrowserLocalStorage(), storageKey, JSON.stringify({
    version: RUN_HISTORY_STORAGE_VERSION,
    runs,
  }));
}

function createRunId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatUsd(value: number): string {
  if (value === 0) {
    return '$0.0000';
  }
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatRunDate(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

function getRunTitle(run: ClaudeFeedStoredRun): string {
  return run.kind === 'feed' ? run.prompt : 'Taste profile from LW history';
}

async function fetchClaudeFeed(
  prompt: string,
  profile: string,
  model: ClaudeFeedModelId,
): Promise<ClaudeFeedApiResponse> {
  const response = await fetch('/api/claude-frontpage-feed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      profile: profile.trim() || undefined,
      model,
    }),
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Claude couldn’t build this feed.'));
  }
  return claudeFeedResponseSchema.parse(body);
}

async function fetchClaudeProfile(model: ClaudeFeedModelId): Promise<ClaudeProfileApiResponse> {
  const response = await fetch('/api/claude-frontpage-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model }),
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Claude couldn’t build your taste profile.'));
  }
  return claudeFeedProfileResponseSchema.parse(body);
}

const RunHistoryMenu = ({
  runs,
  onSelect,
}: {
  runs: ClaudeFeedStoredRun[];
  onSelect: (run: ClaudeFeedStoredRun) => void;
}) => {
  const classes = useStyles(styles);
  return <div className={classes.historyPanel} role="menu" aria-label="Claude feed run history">
    <div className={classes.historyHeader}>Saved in this browser</div>
    {runs.length === 0 && <div className={classes.historyEmpty}>Your generated feeds and profiles will appear here.</div>}
    {runs.map((run) => <button
      type="button"
      role="menuitem"
      className={classes.historyRun}
      onClick={() => onSelect(run)}
      key={run.id}
    >
      <span className={classes.historyRunTitle}>{getRunTitle(run)}</span>
      <span className={classes.historyRunMeta}>
        {formatRunDate(run.createdAt)} · {claudeFeedModelConfigs[run.model].shortLabel} · {formatUsd(run.costUsd)}{run.costIsEstimated ? ' est.' : ''}
      </span>
    </button>)}
  </div>;
};

const ClaudeFeedLoading = () => {
  const classes = useStyles(styles);
  return <div aria-label="Building your feed" aria-busy="true">
    {[0, 1, 2, 3, 4].map((index) => <div className={classes.skeletonItem} key={index}>
      <div className={classes.skeletonRank}/>
      <div className={classes.skeletonBody}>
        <div className={classes.skeletonLine}/>
        <div className={classNames(classes.skeletonLine, classes.skeletonLineShort)}/>
      </div>
    </div>)}
  </div>;
};

function getPostMetaInfo(): FeedPostMetaInfo {
  return {
    sources: [],
    displayStatus: 'expanded',
    highlight: false,
    isRead: false,
  };
}

function getCommentThread(comment: UltraFeedComment): DisplayFeedCommentThread {
  const commentMetaInfo: FeedCommentMetaInfo = {
    sources: [],
    descendentCount: comment.descendentCount,
    displayStatus: 'expanded',
    postedAt: comment.postedAt ? new Date(comment.postedAt) : null,
    isRead: false,
    isParentPostRead: true,
  };
  return {
    _id: `claude-comment-${comment._id}`,
    comments: [comment],
    commentMetaInfos: {
      [comment._id]: commentMetaInfo,
    },
    post: comment.post,
  };
}

const ClaudeFeedResultShell = ({
  item,
  children,
}: {
  item: ClaudeFeedItem;
  children: React.ReactNode;
}) => {
  const classes = useStyles(styles);
  return <div className={classes.nativeItem}>
    <FeedItemWrapper>{children}</FeedItemWrapper>
    <LWTooltip title={item.reason} placement="left" distance={8}>
      <button
        type="button"
        className={classes.reasonButton}
        aria-label={`Why this ${getTypeLabel(item.type).toLowerCase()} is in this queue`}
      >?</button>
    </LWTooltip>
  </div>;
};

const ClaudeFeedResult = ({
  item,
  post,
  comment,
  tag,
  settings,
}: {
  item: ClaudeFeedItem;
  post?: PostsListWithVotes;
  comment?: UltraFeedComment;
  tag?: TagPreviewFragment;
  settings: UltraFeedSettingsType;
}) => {
  const classes = useStyles(styles);
  if (item.type === 'post' && post) {
    return <ClaudeFeedResultShell item={item}>
      <UltraFeedPostItem
        post={post}
        postMetaInfo={getPostMetaInfo()}
        index={item.rank - 1}
        settings={settings}
      />
    </ClaudeFeedResultShell>;
  }
  if (item.type === 'comment' && comment) {
    return <ClaudeFeedResultShell item={item}>
      <UltraFeedThreadItem
        thread={getCommentThread(comment)}
        index={item.rank - 1}
        settings={settings}
        forceParentPostCollapsed
      />
    </ClaudeFeedResultShell>;
  }
  if (item.type === 'wiki' && tag) {
    return <ClaudeFeedResultShell item={item}>
      <div className={classes.wikiItem}>
        <TagPreview tag={tag} showCount={false} postCount={0}/>
      </div>
    </ClaudeFeedResultShell>;
  }
  return null;
};

const ClaudeFrontpageFeed = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { settings } = useUltraFeedSettings();
  const { captureEvent } = useTracking();
  const [prompt, setPrompt] = useState('');
  const [profile, setProfile] = useState('');
  const [model, setModel] = useState<ClaudeFeedModelId>(defaultClaudeFeedModel);
  const [items, setItems] = useState<ClaudeFeedItem[]>([]);
  const [runs, setRuns] = useState<ClaudeFeedStoredRun[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const storageKey = useMemo(() => getRunHistoryStorageKey(currentUser?._id), [currentUser?._id]);

  useEffect(() => {
    setRuns(readStoredRuns(storageKey));
  }, [storageKey]);

  const saveRun = useCallback((run: ClaudeFeedStoredRun) => {
    setRuns((previousRuns) => {
      const nextRuns = [run, ...previousRuns].slice(0, MAX_STORED_RUNS);
      writeStoredRuns(storageKey, nextRuns);
      return nextRuns;
    });
  }, [storageKey]);

  const totalSpend = useMemo(
    () => runs.reduce((total, run) => total + run.costUsd, 0),
    [runs],
  );
  const visibleItems = useMemo(
    () => filter === 'all' ? items : items.filter((item) => item.type === filter),
    [filter, items],
  );
  const documentIds = useMemo(() => ({
    postIds: items.filter(({ type }) => type === 'post').map(({ id }) => id),
    commentIds: items.filter(({ type }) => type === 'comment').map(({ id }) => id),
    tagIds: items.filter(({ type }) => type === 'wiki').map(({ id }) => id),
  }), [items]);
  const {
    data: documentsData,
    loading: documentsLoading,
    error: documentsError,
  } = useQuery(ClaudeFrontpageFeedDocumentsQuery, {
    variables: {
      ...documentIds,
      limit: 18,
    },
    skip: items.length === 0,
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });
  const postsById = useMemo(
    () => new Map((documentsData?.posts?.results ?? []).map((post) => [post._id, post])),
    [documentsData?.posts?.results],
  );
  const commentsById = useMemo(
    () => new Map((documentsData?.comments?.results ?? []).map((comment) => [comment._id, comment])),
    [documentsData?.comments?.results],
  );
  const tagsById = useMemo(
    () => new Map((documentsData?.tags?.results ?? []).map((tag) => [tag._id, tag])),
    [documentsData?.tags?.results],
  );
  const resultsLoading = loading || (items.length > 0 && documentsLoading);
  const documentsUnavailable = !!documentsError && postsById.size + commentsById.size + tagsById.size === 0;

  const selectStoredRun = useCallback((run: ClaudeFeedStoredRun) => {
    if (loading || profileLoading) {
      return;
    }
    setModel(run.model);
    setError(null);
    setProfileError(null);
    if (run.kind === 'feed') {
      setPrompt(run.prompt);
      setProfile(run.profile ?? '');
      setItems(run.items);
      setFilter('all');
    } else {
      setProfile(run.profile);
    }
    captureEvent('claudeFrontpageStoredRunSelected', { kind: run.kind });
  }, [captureEvent, loading, profileLoading]);

  const submitPrompt = async () => {
    const trimmedPrompt = prompt.trim();
    const trimmedProfile = profile.trim();
    if (trimmedPrompt.length < 3 || loading || profileLoading) {
      return;
    }
    setLoading(true);
    setError(null);
    captureEvent('claudeFrontpageFeedRequested', {
      promptLength: trimmedPrompt.length,
      profileLength: trimmedProfile.length,
      model,
    });
    try {
      const response = await fetchClaudeFeed(trimmedPrompt, trimmedProfile, model);
      setItems(response.items);
      setModel(response.model);
      const run: ClaudeFeedStoredRun = {
        id: createRunId(),
        kind: 'feed',
        createdAt: new Date().toISOString(),
        prompt: trimmedPrompt,
        profile: trimmedProfile || undefined,
        items: response.items,
        model: response.model,
        usage: response.usage,
        costUsd: response.costUsd,
        costIsEstimated: response.costIsEstimated,
      };
      saveRun(run);
      captureEvent('claudeFrontpageFeedReceived', {
        resultCount: response.items.length,
        model: response.model,
        costUsd: response.costUsd,
        costIsEstimated: response.costIsEstimated,
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Claude couldn’t build this feed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const buildProfile = async () => {
    if (!currentUser || loading || profileLoading) {
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    captureEvent('claudeFrontpageProfileRequested', { model });
    try {
      const response = await fetchClaudeProfile(model);
      setProfile(response.profile);
      setModel(response.model);
      const run: ClaudeFeedStoredRun = {
        id: createRunId(),
        kind: 'profile',
        createdAt: new Date().toISOString(),
        profile: response.profile,
        model: response.model,
        usage: response.usage,
        costUsd: response.costUsd,
        costIsEstimated: response.costIsEstimated,
      };
      saveRun(run);
      captureEvent('claudeFrontpageProfileReceived', {
        profileLength: response.profile.length,
        model: response.model,
        costUsd: response.costUsd,
        costIsEstimated: response.costIsEstimated,
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Claude couldn’t build your taste profile.';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitPrompt();
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitPrompt();
    }
  };

  const handleModelChange = (value: string) => {
    const nextModel = claudeFeedModelIds.find((modelId) => modelId === value);
    if (nextModel) {
      setModel(nextModel);
    }
  };

  const profileButton = <button
    type="button"
    className={classes.controlButton}
    onClick={() => void buildProfile()}
    disabled={!currentUser || loading || profileLoading}
  >
    {profileLoading ? 'Reading your history…' : profile ? 'Rebuild profile from LW history' : 'Build profile from LW history'}
  </button>;

  return <div className={classes.root}>
    <form className={classes.promptForm} onSubmit={handleSubmit}>
      <ClaudeSparkIcon className={classes.claudeIcon}/>
      <textarea
        className={classes.promptInput}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={handlePromptKeyDown}
        maxLength={1_000}
        rows={1}
        placeholder="What do you want to read? Ask for posts, comments, or wiki articles…"
        aria-label="Describe what you want in your LessWrong feed"
      />
      <button
        type="submit"
        className={classes.submitButton}
        disabled={prompt.trim().length < 3 || loading || profileLoading}
        aria-label="Build feed"
      >
        <ArrowUpwardIcon className={classNames(classes.submitIcon, { [classes.submitIconLoading]: loading })}/>
      </button>
    </form>

    <div className={classes.controls}>
      <div className={classes.primaryControls}>
        {currentUser ? profileButton : <LWTooltip title="Log in to build a profile from your LessWrong history.">
          <span>{profileButton}</span>
        </LWTooltip>}
        <select
          className={classes.modelSelect}
          value={model}
          onChange={(event) => handleModelChange(event.target.value)}
          disabled={loading || profileLoading}
          aria-label="Claude model"
        >
          {claudeFeedModelIds.map((modelId) => <option value={modelId} key={modelId}>
            {claudeFeedModelConfigs[modelId].label}
          </option>)}
        </select>
      </div>
      <LWTooltip
        title={<RunHistoryMenu runs={runs} onSelect={selectStoredRun}/>}
        placement="bottom-end"
        popperClassName={classes.historyTooltip}
        tooltip={false}
        clickable
      >
        <button
          type="button"
          className={classNames(classes.controlButton, classes.spendButton)}
          aria-label={`${formatUsd(totalSpend)} spent on Claude feed API tokens; show run history`}
        >
          {formatUsd(totalSpend)} spent
        </button>
      </LWTooltip>
    </div>

    {profile && <div className={classes.profilePanel}>
      <div className={classes.profileHeader}>
        <span>Reader profile</span>
        <span>{profile.length}/800</span>
      </div>
      <textarea
        className={classes.profileInput}
        value={profile}
        onChange={(event) => setProfile(event.target.value)}
        maxLength={800}
        aria-label="Claude reader profile"
      />
    </div>}
    {profileError && <div className={classes.profileStatus}>{profileError}</div>}

    <nav className={classes.filterRail} aria-label="Filter feed results">
      {filterOptions.map((option) => <button
        type="button"
        key={option.value}
        className={classNames(classes.filterButton, { [classes.filterButtonActive]: filter === option.value })}
        onClick={() => setFilter(option.value)}
        aria-pressed={filter === option.value}
      >
        {option.label}
      </button>)}
    </nav>

    <div className={classes.results} aria-live="polite">
      {resultsLoading && <ClaudeFeedLoading/>}
      {!resultsLoading && error && <div className={classNames(classes.status, classes.error)}>{error}</div>}
      {!resultsLoading && !error && documentsUnavailable && (
        <div className={classNames(classes.status, classes.error)}>The selected LessWrong items couldn’t be loaded.</div>
      )}
      {!resultsLoading && !error && !documentsUnavailable && items.length > 0 && visibleItems.length === 0 && (
        <div className={classes.status}>No {filterOptions.find(({ value }) => value === filter)?.label.toLowerCase()} in this queue.</div>
      )}
      {!resultsLoading && !error && !documentsUnavailable && <UltraFeedWrappers incognitoMode={false} feedType="ultraFeed">
        {visibleItems.map((item) => <ClaudeFeedResult
          item={item}
          post={postsById.get(item.id)}
          comment={commentsById.get(item.id)}
          tag={tagsById.get(item.id)}
          settings={settings}
          key={`${item.type}:${item.id}`}
        />)}
      </UltraFeedWrappers>}
    </div>
  </div>;
};

export default ClaudeFrontpageFeed;
