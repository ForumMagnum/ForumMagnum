import React, { useMemo, useState } from 'react';
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

type SortKey = 'title' | 'status' | 'images' | 'category';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<PostProcessingStatus, number> = {
  'needs-selection': 0,
  'needs-upscale': 1,
  'needs-coordinates': 2,
  'review': 3,
};

const styles = defineStyles("TableView", (theme: ThemeType) => ({
  toolbar: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  filterSelect: {
    ...theme.typography.body2,
    fontSize: 12,
    padding: '4px 8px',
    border: theme.palette.border.faint,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    ...theme.typography.body2,
    fontSize: 13,
  },
  thead: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: theme.palette.background.default,
  },
  th: {
    textAlign: 'left',
    padding: '8px 6px',
    borderBottom: `2px solid ${theme.palette.greyAlpha(0.15)}`,
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  td: {
    padding: '6px',
    borderBottom: theme.palette.border.faint,
    verticalAlign: 'middle',
  },
  row: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.03),
    },
  },
  rowExpanded: {
    backgroundColor: theme.palette.greyAlpha(0.05),
  },
  thumbnail: {
    width: 60,
    height: 30,
    objectFit: 'cover',
    borderRadius: 2,
  },
  titleCell: {
    maxWidth: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    ...theme.typography.body2,
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 8,
    color: theme.palette.text.alwaysWhite,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  expandedRow: {
    backgroundColor: theme.palette.greyAlpha(0.02),
  },
  expandedContent: {
    padding: 16,
  },
  sortArrow: {
    marginLeft: 2,
    fontSize: 10,
  },
  expandIcon: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
}));

const ALL_STATUSES: PostProcessingStatus[] = ['needs-selection', 'needs-upscale', 'needs-coordinates', 'review'];

export function TableView({posts, refetchImages}: AdminViewProps) {
  const classes = useStyles(styles);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostProcessingStatus | 'all'>('needs-upscale');
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filteredPosts = statusFilter === 'all'
    ? posts
    : posts.filter(p => p.status === statusFilter);

  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = a.post.title.localeCompare(b.post.title);
          break;
        case 'status':
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case 'images':
          cmp = a.images.length - b.images.length;
          break;
        case 'category':
          cmp = (a.post.reviewWinner?.category ?? '').localeCompare(b.post.reviewWinner?.category ?? '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredPosts, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function renderSortArrow(key: SortKey) {
    if (sortKey !== key) return null;
    return <span className={classes.sortArrow}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
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
    <table className={classes.table}>
      <thead className={classes.thead}>
        <tr>
          <th className={classes.th} style={{width: 30}}>#</th>
          <th className={classes.th} onClick={() => handleSort('title')}>
            Title{renderSortArrow('title')}
          </th>
          <th className={classes.th} onClick={() => handleSort('category')}>
            Category{renderSortArrow('category')}
          </th>
          <th className={classes.th} style={{width: 70}}>Art</th>
          <th className={classes.th} onClick={() => handleSort('images')} style={{width: 60}}>
            Imgs{renderSortArrow('images')}
          </th>
          <th className={classes.th} onClick={() => handleSort('status')} style={{width: 120}}>
            Status{renderSortArrow('status')}
          </th>
          <th className={classes.th} style={{width: 30}}></th>
        </tr>
      </thead>
      <tbody>
        {sortedPosts.map((item, idx) => {
          const isExpanded = expandedPostId === item.post._id;
          const thumbUrl = item.activeImage
            ? getCloudinaryThumbnail(item.activeImage.splashArtImageUrl, 120)
            : item.images[0]
              ? getCloudinaryThumbnail(item.images[0].splashArtImageUrl, 120)
              : null;

          return <React.Fragment key={item.post._id}>
            <tr
              className={classNames(classes.row, isExpanded && classes.rowExpanded)}
              onClick={() => setExpandedPostId(isExpanded ? null : item.post._id)}
            >
              <td className={classes.td}>{idx + 1}</td>
              <td className={classNames(classes.td, classes.titleCell)}>
                <Link to={postGetPageUrl(item.post)} target="_blank" onClick={e => e.stopPropagation()}>
                  {item.post.title}
                </Link>
              </td>
              <td className={classes.td}>{item.post.reviewWinner?.category ?? '—'}</td>
              <td className={classes.td}>
                {thumbUrl && <img className={classes.thumbnail} src={thumbUrl} />}
              </td>
              <td className={classes.td}>{item.images.length}</td>
              <td className={classes.td}>
                <span
                  className={classes.statusBadge}
                  style={{backgroundColor: STATUS_COLORS[item.status]}}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </td>
              <td className={classes.td}>
                <span className={classes.expandIcon}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
              </td>
            </tr>
            {isExpanded && <tr className={classes.expandedRow}>
              <td colSpan={7} className={classes.td}>
                <div className={classes.expandedContent} onClick={e => e.stopPropagation()}>
                  <ImageProvider>
                    <GenerateImagesButton
                      postId={item.post._id}
                      allowCustomPrompt={true}
                      buttonText="Generate More Images"
                      onComplete={refetchImages}
                    />
                    <PostWithArtGrid
                      post={item.post}
                      images={item.images}
                      defaultExpanded={true}
                    />
                  </ImageProvider>
                </div>
              </td>
            </tr>}
          </React.Fragment>;
        })}
      </tbody>
    </table>
  </>;
}
