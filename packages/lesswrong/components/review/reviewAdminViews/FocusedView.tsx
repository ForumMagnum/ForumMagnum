import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { getCloudinaryThumbnail, PostWithArtGrid } from '@/components/posts/PostsPage/BestOfLessWrong/PostWithArtGrid';
import { ImageProvider } from '@/components/posts/PostsPage/ImageContext';
import GenerateImagesButton from '../GenerateImagesButton';
import classNames from 'classnames';
import groupBy from 'lodash/groupBy';
import {
  type AdminViewProps,
  type PostProcessingStatus,
  type ReviewPostWithStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from './types';
import { CoordinateEditingView } from './CoordinateEditor';

const SIDEBAR_WIDTH = 260;

const styles = defineStyles("FocusedView", (theme: ThemeType) => ({
  container: {
    display: 'flex',
    gap: 16,
    minHeight: 600,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    borderRight: theme.palette.border.faint,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 160px)',
    position: 'sticky',
    top: 80,
  },
  sidebarFilters: {
    padding: '4px 8px 8px',
    borderBottom: theme.palette.border.faint,
    marginBottom: 4,
  },
  filterSelect: {
    ...theme.typography.body2,
    fontSize: 12,
    padding: '2px 4px',
    border: theme.palette.border.faint,
    borderRadius: 3,
    backgroundColor: 'transparent',
    width: '100%',
  },
  sidebarItem: {
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 3,
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.05),
    },
  },
  sidebarItemActive: {
    backgroundColor: theme.palette.greyAlpha(0.1),
    fontWeight: 600,
  },
  sidebarTitle: {
    ...theme.typography.body2,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  sidebarThumb: {
    width: 28,
    height: 14,
    borderRadius: 2,
    objectFit: 'cover',
  },
  sidebarCount: {
    ...theme.typography.body2,
    fontSize: 10,
    color: theme.palette.grey[500],
    minWidth: 16,
    textAlign: 'right',
  },
  statusDot: {
    width: 8,
    height: 8,
    minWidth: 8,
    borderRadius: '50%',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  postTitle: {
    ...theme.typography.body2,
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  navButtons: {
    display: 'flex',
    gap: 4,
  },
  navButton: {
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
    '&:disabled': {
      opacity: 0.3,
      cursor: 'default',
    },
  },
  statusBadge: {
    ...theme.typography.body2,
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    color: theme.palette.text.alwaysWhite,
    fontWeight: 500,
  },
  modeToggle: {
    ...theme.typography.body2,
    fontSize: 11,
    padding: '3px 10px',
    border: theme.palette.border.faint,
    borderRadius: 3,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.05),
    },
  },
  modeToggleActive: {
    backgroundColor: theme.palette.greyAlpha(0.12),
    fontWeight: 600,
  },
  emptyState: {
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    textAlign: 'center',
    padding: 40,
  },
}));

const ALL_STATUSES: PostProcessingStatus[] = ['needs-selection', 'needs-upscale', 'needs-coordinates', 'review'];

function getFirstDisplayedImageId(images: ReviewWinnerArtImages[]): string | null {
  if (images.length === 0) return null;
  const byPrompt = groupBy(images, img => img.splashArtImagePrompt);
  const firstPrompt = Object.keys(byPrompt)[0];
  if (!firstPrompt) return null;
  return byPrompt[firstPrompt]?.[0]?._id ?? null;
}

/** Returns true if the active image is NOT the first image of the first prompt group shown in UI. */
function hasDeliberateSelection(item: ReviewPostWithStatus): boolean {
  if (!item.activeImage) return false;
  const firstDisplayedImageId = getFirstDisplayedImageId(item.images);
  if (!firstDisplayedImageId) return false;
  return item.activeImage._id !== firstDisplayedImageId;
}

/** Returns the most recent createdAt timestamp across all images for a post. */
function getMostRecentArtTimestamp(item: ReviewPostWithStatus): number {
  if (item.images.length === 0) return 0;
  return Math.max(...item.images.map(img => new Date(img.createdAt).getTime()));
}

type EditMode = 'coordinates' | 'images';

export function FocusedView({posts, refetchImages}: AdminViewProps) {
  const classes = useStyles(styles);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(posts[0]?.post._id ?? null);
  const [statusFilter, setStatusFilter] = useState<PostProcessingStatus | 'all'>('needs-upscale');
  const [editMode, setEditMode] = useState<EditMode>(statusFilter === 'needs-coordinates' ? 'coordinates' : 'images');

  const filteredPosts = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? posts
      : posts.filter(p => p.status === statusFilter);

    // For "needs-upscale", sort posts where the user has deliberately selected
    // a non-default image (i.e. not the first image of the first prompt) to the top
    if (statusFilter === 'needs-upscale') {
      return [...filtered].sort((a, b) => {
        const aDeliberate = hasDeliberateSelection(a);
        const bDeliberate = hasDeliberateSelection(b);
        if (aDeliberate && !bDeliberate) return -1;
        if (!aDeliberate && bDeliberate) return 1;
        return getMostRecentArtTimestamp(b) - getMostRecentArtTimestamp(a);
      });
    }

    return filtered;
  }, [posts, statusFilter]);

  const selectedPost = filteredPosts.find(p => p.post._id === selectedPostId) ?? filteredPosts[0] ?? null;
  const currentIndex = selectedPost ? filteredPosts.indexOf(selectedPost) : -1;

  useEffect(() => {
    if (!selectedPost && filteredPosts.length > 0) {
      setSelectedPostId(filteredPosts[0].post._id);
    }
  }, [selectedPost, filteredPosts]);

  const goNext = useCallback(() => {
    if (currentIndex < filteredPosts.length - 1) {
      setSelectedPostId(filteredPosts[currentIndex + 1].post._id);
    }
  }, [currentIndex, filteredPosts]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedPostId(filteredPosts[currentIndex - 1].post._id);
    }
  }, [currentIndex, filteredPosts]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  return <div className={classes.container}>
    <div className={classes.sidebar}>
      <div className={classes.sidebarFilters}>
        <select
          className={classes.filterSelect}
          value={statusFilter}
          onChange={e => {
            const newFilter = e.target.value as PostProcessingStatus | 'all';
            setStatusFilter(newFilter);
            setEditMode(newFilter === 'needs-coordinates' ? 'coordinates' : 'images');
          }}
        >
          <option value="all">All ({posts.length})</option>
          {ALL_STATUSES.map(s => {
            const count = posts.filter(p => p.status === s).length;
            if (count === 0) return null;
            return <option key={s} value={s}>{STATUS_LABELS[s]} ({count})</option>;
          })}
        </select>
      </div>
      {filteredPosts.map(item => {
        const thumbUrl = item.activeImage
          ? getCloudinaryThumbnail(item.activeImage.splashArtImageUrl, 60)
          : item.images[0]
            ? getCloudinaryThumbnail(item.images[0].splashArtImageUrl, 60)
            : null;
        return <div
          key={item.post._id}
          className={classNames(classes.sidebarItem, selectedPost?.post._id === item.post._id && classes.sidebarItemActive)}
          onClick={() => setSelectedPostId(item.post._id)}
        >
          <span className={classes.statusDot} style={{backgroundColor: STATUS_COLORS[item.status]}} />
          <span className={classes.sidebarTitle}>{item.post.title}</span>
          <span className={classes.sidebarCount}>{item.images.length}</span>
          {thumbUrl && <img className={classes.sidebarThumb} src={thumbUrl} />}
        </div>;
      })}
    </div>
    <div className={classes.main}>
      {selectedPost ? <>
        <div className={classes.postHeader}>
          <div>
            <h2 className={classes.postTitle}>
              <Link to={postGetPageUrl(selectedPost.post)} target="_blank">
                {selectedPost.post.title}
              </Link>
            </h2>
            <span
              className={classes.statusBadge}
              style={{backgroundColor: STATUS_COLORS[selectedPost.status]}}
            >
              {STATUS_LABELS[selectedPost.status]}
            </span>
            {' '}
            <span style={{fontSize: 12, color: '#888'}}>{selectedPost.images.length} images</span>
          </div>
          <div className={classes.navButtons}>
            {selectedPost.activeImage && <>
              <button
                className={classNames(classes.modeToggle, editMode === 'images' && classes.modeToggleActive)}
                onClick={() => setEditMode('images')}
              >
                Images
              </button>
              <button
                className={classNames(classes.modeToggle, editMode === 'coordinates' && classes.modeToggleActive)}
                onClick={() => setEditMode('coordinates')}
              >
                Coordinates
              </button>
            </>}
            <button className={classes.navButton} onClick={goPrev} disabled={currentIndex <= 0}>
              Prev (k)
            </button>
            <span style={{fontSize: 12, alignSelf: 'center'}}>
              {currentIndex + 1}/{filteredPosts.length}
            </span>
            <button className={classes.navButton} onClick={goNext} disabled={currentIndex >= filteredPosts.length - 1}>
              Next (j)
            </button>
          </div>
        </div>
        {editMode === 'images' ? (
          <ImageProvider key={selectedPost.post._id}>
            <GenerateImagesButton
              postId={selectedPost.post._id}
              allowCustomPrompt={true}
              buttonText="Generate More Images"
              onComplete={refetchImages}
            />
            <PostWithArtGrid
              post={selectedPost.post}
              images={selectedPost.images}
              defaultExpanded={true}
              fadeNonUpscaled={statusFilter === 'needs-coordinates'}
              refetchImages={refetchImages}
            />
          </ImageProvider>
        ) : selectedPost.activeImage ? (
          <CoordinateEditingView
            key={selectedPost.activeImage._id}
            image={selectedPost.activeImage}
            post={selectedPost.post}
            onSaved={refetchImages}
          />
        ) : null}
      </> : <div className={classes.emptyState}>
        No posts match the current filter.
      </div>}
    </div>
  </div>;
}
