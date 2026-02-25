import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { getCloudinaryThumbnail, PostWithArtGrid } from '@/components/posts/PostsPage/BestOfLessWrong/PostWithArtGrid';
import { ImageProvider } from '@/components/posts/PostsPage/ImageContext';
import GenerateImagesButton from '../GenerateImagesButton';
import classNames from 'classnames';
import {
  type AdminViewProps,
  type PostProcessingStatus,
  type ReviewPostWithStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from './types';

const styles = defineStyles("PipelineView", (theme: ThemeType) => ({
  columns: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    minHeight: 400,
  },
  column: {
    flex: 1,
    minWidth: 0,
    borderRadius: 6,
    backgroundColor: theme.palette.greyAlpha(0.03),
    padding: 8,
  },
  columnHeader: {
    ...theme.typography.body2,
    fontWeight: 600,
    fontSize: 13,
    padding: '8px 4px',
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.greyAlpha(0.03),
    zIndex: 1,
  },
  columnCount: {
    ...theme.typography.body2,
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  card: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
    cursor: 'pointer',
    border: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    '&:hover': {
      border: `1px solid ${theme.palette.greyAlpha(0.25)}`,
    },
  },
  cardExpanded: {
    border: `1px solid ${theme.palette.primary.main}`,
  },
  cardTitle: {
    ...theme.typography.body2,
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 4,
    lineHeight: '1.3em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardThumbnail: {
    width: '100%',
    height: 'auto',
    borderRadius: 2,
    marginBottom: 4,
  },
  cardMeta: {
    ...theme.typography.body2,
    fontSize: 11,
    color: theme.palette.grey[500],
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: theme.palette.border.faint,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
  },
}));

const COLUMN_ORDER: PostProcessingStatus[] = ['needs-selection', 'needs-upscale', 'needs-coordinates', 'review'];

function PipelineCard({item, isExpanded, onClick, refetchImages}: {
  item: ReviewPostWithStatus;
  isExpanded: boolean;
  onClick: () => void;
  refetchImages: () => void;
}) {
  const classes = useStyles(styles);
  const thumbUrl = item.activeImage
    ? getCloudinaryThumbnail(item.activeImage.splashArtImageUrl, 250)
    : item.images[0]
      ? getCloudinaryThumbnail(item.images[0].splashArtImageUrl, 250)
      : null;

  return <div
    className={classNames(classes.card, isExpanded && classes.cardExpanded)}
    onClick={onClick}
  >
    {thumbUrl && <img className={classes.cardThumbnail} src={thumbUrl} />}
    <div className={classes.cardTitle}>
      <Link to={postGetPageUrl(item.post)} target="_blank" onClick={e => e.stopPropagation()}>
        {item.post.title}
      </Link>
    </div>
    <div className={classes.cardMeta}>{item.images.length} images</div>
    {isExpanded && <div className={classes.expandedContent} onClick={e => e.stopPropagation()}>
      <ImageProvider>
        <GenerateImagesButton
          postId={item.post._id}
          allowCustomPrompt={true}
          buttonText="Generate More"
          onComplete={refetchImages}
        />
        <PostWithArtGrid post={item.post} images={item.images} defaultExpanded={true} />
      </ImageProvider>
    </div>}
  </div>;
}

export function PipelineView({posts, refetchImages}: AdminViewProps) {
  const classes = useStyles(styles);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const columns: Record<PostProcessingStatus, ReviewPostWithStatus[]> = {
    'needs-selection': [],
    'needs-upscale': [],
    'needs-coordinates': [],
    'review': [],
  };
  for (const p of posts) {
    columns[p.status].push(p);
  }

  return <div className={classes.columns}>
    {COLUMN_ORDER.filter(status => columns[status].length > 0).map(status => (
      <div key={status} className={classes.column}>
        <div className={classes.columnHeader}>
          <span>
            <span className={classes.statusDot} style={{backgroundColor: STATUS_COLORS[status]}} />{' '}
            {STATUS_LABELS[status]}
          </span>
          <span className={classes.columnCount}>{columns[status].length}</span>
        </div>
        {columns[status].map(item => (
          <PipelineCard
            key={item.post._id}
            item={item}
            isExpanded={expandedPostId === item.post._id}
            onClick={() => setExpandedPostId(expandedPostId === item.post._id ? null : item.post._id)}
            refetchImages={refetchImages}
          />
        ))}
      </div>
    ))}
  </div>;
}
