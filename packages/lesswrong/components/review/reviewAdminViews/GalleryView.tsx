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

const styles = defineStyles("GalleryView", (theme: ThemeType) => ({
  toolbar: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterSelect: {
    ...theme.typography.body2,
    fontSize: 12,
    padding: '4px 8px',
    border: theme.palette.border.faint,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12,
  },
  card: {
    borderRadius: 6,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
    '&:hover': {
      boxShadow: theme.palette.boxShadow.lwCard,
    },
  },
  cardSelected: {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: theme.palette.boxShadow.lwCard,
  },
  cardImage: {
    width: '100%',
    height: 110,
    objectFit: 'cover',
    display: 'block',
  },
  cardBody: {
    padding: '6px 8px',
  },
  cardTitle: {
    ...theme.typography.body2,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: '1.3em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    marginBottom: 4,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    ...theme.typography.body2,
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 8,
    color: theme.palette.text.alwaysWhite,
    fontWeight: 500,
  },
  imageCount: {
    ...theme.typography.body2,
    fontSize: 10,
    color: theme.palette.grey[500],
  },
  expandedSection: {
    gridColumn: '1 / -1',
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 6,
    padding: 16,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
  },
  expandedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedTitle: {
    ...theme.typography.body2,
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    ...theme.typography.body2,
    fontSize: 12,
    padding: '4px 12px',
    border: theme.palette.border.faint,
    borderRadius: 3,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.05),
    },
  },
}));

const ALL_STATUSES: PostProcessingStatus[] = ['needs-selection', 'needs-upscale', 'needs-coordinates', 'review'];

export function GalleryView({posts, refetchImages}: AdminViewProps) {
  const classes = useStyles(styles);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostProcessingStatus | 'all'>('needs-upscale');

  const filteredPosts = statusFilter === 'all'
    ? posts
    : posts.filter(p => p.status === statusFilter);

  // Build items with expanded section inserted after the expanded card
  const items: Array<{type: 'card', item: ReviewPostWithStatus} | {type: 'expanded', item: ReviewPostWithStatus}> = [];
  for (const item of filteredPosts) {
    items.push({type: 'card', item});
    if (expandedPostId === item.post._id) {
      items.push({type: 'expanded', item});
    }
  }

  return <>
    <div className={classes.toolbar}>
      <select
        className={classes.filterSelect}
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value as PostProcessingStatus | 'all')}
      >
        <option value="all">All ({posts.length})</option>
        {ALL_STATUSES.map(s => {
          const count = posts.filter(p => p.status === s).length;
          if (count === 0) return null;
          return <option key={s} value={s}>{STATUS_LABELS[s]} ({count})</option>;
        })}
      </select>
    </div>
    <div className={classes.grid}>
      {items.map(entry => {
        if (entry.type === 'expanded') {
          return <div key={`expanded-${entry.item.post._id}`} className={classes.expandedSection}>
            <div className={classes.expandedHeader}>
              <h3 className={classes.expandedTitle}>
                <Link to={postGetPageUrl(entry.item.post)} target="_blank">
                  {entry.item.post.title}
                </Link>
              </h3>
              <button className={classes.closeButton} onClick={() => setExpandedPostId(null)}>
                Close
              </button>
            </div>
            <ImageProvider>
              <GenerateImagesButton
                postId={entry.item.post._id}
                allowCustomPrompt={true}
                buttonText="Generate More Images"
                onComplete={refetchImages}
              />
              <PostWithArtGrid
                post={entry.item.post}
                images={entry.item.images}
                defaultExpanded={true}
              />
            </ImageProvider>
          </div>;
        }

        const thumbUrl = entry.item.activeImage
          ? getCloudinaryThumbnail(entry.item.activeImage.splashArtImageUrl, 300)
          : entry.item.images[0]
            ? getCloudinaryThumbnail(entry.item.images[0].splashArtImageUrl, 300)
            : null;

        return <div
          key={entry.item.post._id}
          className={classNames(classes.card, expandedPostId === entry.item.post._id && classes.cardSelected)}
          onClick={() => setExpandedPostId(expandedPostId === entry.item.post._id ? null : entry.item.post._id)}
        >
          {thumbUrl && <img className={classes.cardImage} src={thumbUrl} />}
          <div className={classes.cardBody}>
            <div className={classes.cardTitle}>{entry.item.post.title}</div>
            <div className={classes.cardFooter}>
              <span
                className={classes.statusBadge}
                style={{backgroundColor: STATUS_COLORS[entry.item.status]}}
              >
                {STATUS_LABELS[entry.item.status]}
              </span>
              <span className={classes.imageCount}>{entry.item.images.length} imgs</span>
            </div>
          </div>
        </div>;
      })}
    </div>
  </>;
}
