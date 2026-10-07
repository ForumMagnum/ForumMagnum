import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { allFeedItemSourceTypes } from './ultraFeedTypes';
import type { FeedCommentMetaInfo, FeedItemSourceType, FeedPostMetaInfo, RankedItemMetadata } from './ultraFeedTypes';
import UltraFeedScoreBreakdown from './UltraFeedScoreBreakdown';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';

export type UltraFeedDebugSortField = 'score' | 'type' | 'title' | 'sources';
export type UltraFeedDebugSortDirection = 'asc' | 'desc';

const styles = defineStyles('UltraFeedDebugItem', (theme: ThemeType) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: '52px 120px minmax(0, 1fr) 190px',
    gap: 12,
    alignItems: 'baseline',
    padding: '6px 8px',
    borderBottom: theme.palette.border.itemSeparatorBottom,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    color: theme.palette.text.dim,
  },
  score: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    textAlign: 'right',
  },
  scoreText: {
    cursor: 'default',
  },
  type: {
    fontWeight: 600,
    color: theme.palette.text.secondary,
  },
  title: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.text.primary,
  },
  titleLink: {
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  sources: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerRoot: {
    display: 'grid',
    gridTemplateColumns: '52px 120px minmax(0, 1fr) 190px',
    gap: 12,
    alignItems: 'baseline',
    padding: '6px 8px',
    borderBottom: theme.palette.border.itemSeparatorBottom,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 12,
    fontWeight: 700,
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.panelBackground.default,
  },
  headerButton: {
    border: 'none',
    padding: 0,
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    fontWeight: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  headerButtonScore: {
    textAlign: 'right',
  },
}));

const formatScore = (metadata?: RankedItemMetadata): string => {
  return metadata ? metadata.scoreBreakdown.total.toFixed(2) : 'n/a';
};

const formatSources = (sources?: FeedItemSourceType[] | null): string => {
  return sources?.length ? sources.join(', ') : 'no source';
};

const feedItemSourceTypeSet = new Set<string>(allFeedItemSourceTypes);

const toFeedItemSources = (sources?: readonly string[] | null): FeedItemSourceType[] | undefined => {
  return sources?.filter((source): source is FeedItemSourceType => feedItemSourceTypeSet.has(source));
};

const truncate = (text: string, maxLength = 160): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const DebugContentLink = ({ url, children }: { url?: string; children: React.ReactNode }) => {
  const classes = useStyles(styles);
  
  if (!url) {
    return <>{children}</>;
  }
  
  return (
    <Link to={url} className={classes.titleLink}>
      {children}
    </Link>
  );
};

export interface UltraFeedDebugResult {
  type: string;
  feedPost?: FeedPostFragment | null;
  feedCommentThread?: FeedCommentThreadFragment | null;
  feedSpotlight?: FeedSpotlightFragment | null;
}

interface UltraFeedDebugSortData {
  score: number;
  type: string;
  title: string;
  sources: string;
}

const getScore = (metadata?: RankedItemMetadata): number => {
  return metadata?.scoreBreakdown.total ?? Number.NEGATIVE_INFINITY;
};

const getPostSortData = (item: FeedPostFragment): UltraFeedDebugSortData => {
  const metadata: RankedItemMetadata | undefined = item.postMetaInfo?.rankingMetadata;
  return {
    score: getScore(metadata),
    type: 'post',
    title: item.post?.title ?? item._id,
    sources: formatSources(item.postMetaInfo?.sources),
  };
};

const getThreadSortData = (item: FeedCommentThreadFragment): UltraFeedDebugSortData => {
  const firstComment = item.comments[0];
  const firstCommentMeta = firstComment ? item.commentMetaInfos?.[firstComment._id] : undefined;
  const metadata: RankedItemMetadata | undefined = firstCommentMeta?.rankingMetadata ?? item.postMetaInfo?.rankingMetadata;
  const title = firstComment?.contents?.plaintextMainText
    ? firstComment.contents.plaintextMainText
    : item.post?.title ?? item._id;

  return {
    score: getScore(metadata),
    type: firstComment?.shortform ? 'quick take' : 'thread',
    title,
    sources: formatSources(firstCommentMeta?.sources ?? toFeedItemSources(item.postSources)),
  };
};

const getSpotlightSortData = (item: FeedSpotlightFragment): UltraFeedDebugSortData => {
  const metadata: RankedItemMetadata | undefined = item.spotlightMetaInfo?.rankingMetadata;
  const sources = toFeedItemSources(item.spotlightMetaInfo?.sources);
  return {
    score: getScore(metadata),
    type: 'spotlight',
    title: item.post?.title
      ?? item.spotlight?.post?.title
      ?? item.spotlight?.sequence?.title
      ?? item.spotlight?.tag?.name
      ?? item._id,
    sources: formatSources(sources),
  };
};

const getDebugSortData = (result: UltraFeedDebugResult): UltraFeedDebugSortData => {
  if (result.type === 'feedPost' && result.feedPost) {
    return getPostSortData(result.feedPost);
  }
  if (result.type === 'feedCommentThread' && result.feedCommentThread) {
    return getThreadSortData(result.feedCommentThread);
  }
  if (result.type === 'feedSpotlight' && result.feedSpotlight) {
    return getSpotlightSortData(result.feedSpotlight);
  }

  return {
    score: Number.NEGATIVE_INFINITY,
    type: result.type,
    title: '',
    sources: '',
  };
};

export const compareUltraFeedDebugResults = (
  a: UltraFeedDebugResult,
  b: UltraFeedDebugResult,
  field: UltraFeedDebugSortField,
  direction: UltraFeedDebugSortDirection,
): number => {
  const aData = getDebugSortData(a);
  const bData = getDebugSortData(b);
  const multiplier = direction === 'asc' ? 1 : -1;

  if (field === 'score') {
    return (aData.score - bData.score) * multiplier;
  }

  return aData[field].localeCompare(bData[field]) * multiplier;
};

const nextDirection = (
  currentField: UltraFeedDebugSortField,
  currentDirection: UltraFeedDebugSortDirection,
  clickedField: UltraFeedDebugSortField,
): UltraFeedDebugSortDirection => {
  if (clickedField !== currentField) {
    return clickedField === 'score' ? 'desc' : 'asc';
  }
  return currentDirection === 'asc' ? 'desc' : 'asc';
};

const HeaderButton = ({
  field,
  label,
  sortField,
  sortDirection,
  onSortChange,
  scoreColumn = false,
}: {
  field: UltraFeedDebugSortField;
  label: string;
  sortField: UltraFeedDebugSortField;
  sortDirection: UltraFeedDebugSortDirection;
  onSortChange: (field: UltraFeedDebugSortField, direction: UltraFeedDebugSortDirection) => void;
  scoreColumn?: boolean;
}) => {
  const classes = useStyles(styles);
  const isActive = field === sortField;
  const directionLabel = isActive ? ` ${sortDirection}` : '';

  return (
    <button
      className={classNames(classes.headerButton, {
        [classes.headerButtonScore]: scoreColumn,
      })}
      onClick={() => onSortChange(field, nextDirection(sortField, sortDirection, field))}
    >
      {label}{directionLabel}
    </button>
  );
};

export const UltraFeedDebugHeader = ({
  sortField,
  sortDirection,
  onSortChange,
}: {
  sortField: UltraFeedDebugSortField;
  sortDirection: UltraFeedDebugSortDirection;
  onSortChange: (field: UltraFeedDebugSortField, direction: UltraFeedDebugSortDirection) => void;
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.headerRoot}>
      <HeaderButton field="score" label="Score" sortField={sortField} sortDirection={sortDirection} onSortChange={onSortChange} scoreColumn />
      <HeaderButton field="type" label="Type" sortField={sortField} sortDirection={sortDirection} onSortChange={onSortChange} />
      <HeaderButton field="title" label="Content" sortField={sortField} sortDirection={sortDirection} onSortChange={onSortChange} />
      <HeaderButton field="sources" label="Sources" sortField={sortField} sortDirection={sortDirection} onSortChange={onSortChange} />
    </div>
  );
};

const DebugScore = ({
  metadata,
  sources,
  commentMetaInfo,
  postMetaInfo,
}: {
  metadata?: RankedItemMetadata;
  sources?: FeedItemSourceType[] | null;
  commentMetaInfo?: FeedCommentMetaInfo;
  postMetaInfo?: FeedPostMetaInfo;
}) => {
  const classes = useStyles(styles);
  const score = <span className={classes.scoreText}>{formatScore(metadata)}</span>;

  return (
    <div className={classes.score}>
      {metadata ? (
        <UltraFeedScoreBreakdown
          metadata={metadata}
          sources={sources ?? undefined}
          commentMetaInfo={commentMetaInfo}
          postMetaInfo={postMetaInfo}
        >
          {score}
        </UltraFeedScoreBreakdown>
      ) : score}
    </div>
  );
};

export const UltraFeedDebugPostItem = ({ item }: { item: FeedPostFragment }) => {
  const classes = useStyles(styles);
  const metadata: RankedItemMetadata | undefined = item.postMetaInfo?.rankingMetadata;
  const url = item.post ? postGetPageUrl(item.post) : undefined;

  return (
    <div className={classes.root}>
      <DebugScore metadata={metadata} sources={item.postMetaInfo?.sources} postMetaInfo={item.postMetaInfo} />
      <div className={classes.type}>post</div>
      <div className={classes.title}>
        <DebugContentLink url={url}>{item.post?.title ?? item._id}</DebugContentLink>
      </div>
      <div className={classes.sources}>{formatSources(item.postMetaInfo?.sources)}</div>
    </div>
  );
};

export const UltraFeedDebugThreadItem = ({ item }: { item: FeedCommentThreadFragment }) => {
  const classes = useStyles(styles);
  const firstComment = item.comments[0];
  const firstCommentMeta = firstComment ? item.commentMetaInfos?.[firstComment._id] : undefined;
  const metadata: RankedItemMetadata | undefined = firstCommentMeta?.rankingMetadata ?? item.postMetaInfo?.rankingMetadata;
  const title = firstComment?.contents?.plaintextMainText
    ? truncate(firstComment.contents.plaintextMainText)
    : item.post?.title ?? item._id;
  const url = firstComment ? commentGetPageUrlFromIds({
    postId: firstComment.postId,
    postSlug: firstComment.post?.slug ?? item.post?.slug,
    commentId: firstComment.topLevelCommentId ?? firstComment._id,
  }) : undefined;

  return (
    <div className={classes.root}>
      <DebugScore
        metadata={metadata}
        sources={firstCommentMeta?.sources ?? item.postSources}
        commentMetaInfo={firstCommentMeta}
      />
      <div className={classes.type}>{firstComment?.shortform ? 'quick take' : 'thread'}</div>
      <div className={classes.title}>
        <DebugContentLink url={url}>{title}</DebugContentLink>
      </div>
      <div className={classes.sources}>{formatSources(firstCommentMeta?.sources ?? item.postSources)}</div>
    </div>
  );
};

export const UltraFeedDebugSpotlightItem = ({ item }: { item: FeedSpotlightFragment }) => {
  const classes = useStyles(styles);
  const metadata: RankedItemMetadata | undefined = item.spotlightMetaInfo?.rankingMetadata;
  const sources = toFeedItemSources(item.spotlightMetaInfo?.sources);
  const title = item.post?.title
    ?? item.spotlight?.post?.title
    ?? item.spotlight?.sequence?.title
    ?? item.spotlight?.tag?.name
    ?? item._id;
  const spotlightPost = item.post ?? item.spotlight?.post;
  const url = spotlightPost ? postGetPageUrl(spotlightPost) : undefined;

  return (
    <div className={classes.root}>
      <DebugScore metadata={metadata} sources={sources} />
      <div className={classes.type}>spotlight</div>
      <div className={classes.title}>
        <DebugContentLink url={url}>{title}</DebugContentLink>
      </div>
      <div className={classes.sources}>{formatSources(sources)}</div>
    </div>
  );
};
