import React, { useEffect, MouseEvent } from 'react';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { collectionGetPageUrl } from '../../lib/collections/collections/helpers';
import { useBookmark } from '../hooks/useBookmark';
import LWPopper from '../common/LWPopper';
import LWClickAwayListener from '../common/LWClickAwayListener';
import LWTooltip from '../common/LWTooltip';
import ForumIcon from '../common/ForumIcon';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import PortraitCoverImage from './PortraitCoverImage';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const dismissRecommendationTooltip = "Don't remind me to finish reading this sequence unless I visit it again";

const styles = defineStyles('LibraryBookshelfDropdown', (theme: ThemeType) => ({
  dropdown: {
    width: 340,
    background: theme.palette.panelBackground.default,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    boxShadow: `0 6px 24px ${theme.palette.boxShadowColor(0.16)}`,
    overflow: 'hidden',
    fontFamily: theme.typography.fontFamily,
  },
  scrollArea: {
    maxHeight: 440,
    overflowY: 'auto',
  },
  sectionHeader: {
    padding: '12px 16px 8px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.6px',
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
  },
  savedHeaderDivider: {
    borderTop: `1px solid ${theme.palette.grey[200]}`,
    marginTop: 6,
  },
  continueReadingRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '8px 16px',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.grey[100],
    },
    '&:hover $dismissButton': {
      opacity: 1,
    },
  },
  cover: {
    flex: 'none',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: theme.typography.postStyle.fontFamily,
    ...theme.typography.smallCaps,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.text.normal,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowMeta: {
    fontSize: 11.5,
    color: theme.palette.text.dim,
  },
  progressLabel: {
    flex: 'none',
    fontSize: 11.5,
    color: theme.palette.text.dim,
  },
  dismissButton: {
    flex: 'none',
    fontSize: 16,
    color: theme.palette.text.dim,
    opacity: 0,
    transition: 'opacity .2s',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  savedRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    padding: '6px 16px',
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 13.5,
    color: theme.palette.text.normal,
    cursor: 'pointer',
    '&:last-child': {
      paddingBottom: 10,
    },
    '&:hover': {
      background: theme.palette.grey[100],
    },
    '&:hover $unsaveButton': {
      opacity: 1,
    },
  },
  savedTitle: {
    flex: 1,
    minWidth: 0,
    ...theme.typography.smallCaps,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  savedAuthor: {
    flex: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 11.5,
    color: theme.palette.text.dim,
  },
  unsaveButton: {
    flex: 'none',
    alignSelf: 'center',
    fontSize: 15,
    color: theme.palette.text.dim,
    opacity: 0,
    transition: 'opacity .2s',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  footer: {
    display: 'block',
    padding: '10px 16px',
    borderTop: `1px solid ${theme.palette.grey[200]}`,
    fontSize: 12.5,
    fontWeight: 500,
    color: theme.palette.primary.main,
    textAlign: 'right',
    cursor: 'pointer',
  },
}));

const BookshelfSavedRow = ({bookmark}: {
  bookmark: BookmarksBookshelfItemFragment,
}) => {
  const classes = useStyles(styles);
  const sequence = bookmark.sequence;
  const collection = bookmark.collection;
  const item = sequence ?? collection;
  const { icon, toggleBookmark, hoverText } = useBookmark(
    item?._id ?? '',
    sequence ? "Sequences" : "Collections",
    true,
  );

  if (!item) {
    return null;
  }

  const handleUnsaveClick = (event: MouseEvent) => {
    event.stopPropagation();
    toggleBookmark(event);
  };

  const url = sequence
    ? sequenceGetPageUrl(sequence)
    : (collection ? collectionGetPageUrl(collection) : '');

  return <Link to={url} className={classes.savedRow}>
    <span className={classes.savedTitle}>{item.title}</span>
    <span className={classes.savedAuthor}>{item.user?.displayName}</span>
    <LWTooltip title={hoverText} placement="right">
      <ForumIcon icon={icon} className={classes.unsaveButton} onClick={handleUnsaveClick} />
    </LWTooltip>
  </Link>;
};

const BookshelfContinueReadingRow = ({entry, onDismiss}: {
  entry: ContinueReadingQueryQuery_ContinueReading_RecommendResumeSequence,
  onDismiss: (postId: string) => void,
}) => {
  const classes = useStyles(styles);
  const item = entry.sequence ?? entry.collection;

  if (!item) {
    return null;
  }

  const progressPercent = entry.numTotal
    ? Math.round(100 * (entry.numRead ?? 0) / entry.numTotal)
    : 0;

  const handleDismissClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDismiss(entry.nextPost._id);
  };

  return <Link
    to={postGetPageUrl(entry.nextPost, false, entry.sequence?._id ?? null)}
    className={classes.continueReadingRow}
  >
    <PortraitCoverImage
      coverImageId={item.coverImageId}
      gridImageId={item.gridImageId}
      title={item.title ?? ""}
      width={28}
      height={38}
      className={classes.cover}
    />
    <span className={classes.rowText}>
      <div className={classes.rowTitle}>{item.title}</div>
      <div className={classes.rowMeta}>{item.user?.displayName}</div>
    </span>
    {(entry.numRead ?? 0) > 0 &&
      <span className={classes.progressLabel}>{progressPercent}%</span>}
    <LWTooltip title={dismissRecommendationTooltip} placement="right">
      <CloseIcon className={classes.dismissButton} onClick={handleDismissClick} />
    </LWTooltip>
  </Link>;
};

/**
 * The bookshelf dropdown opened from the library continue-reading label row
 * (right-most artboard in the design handoff): the user's complete bookshelf —
 * ALL continue-reading entries (the strip only shows the first four) plus
 * saved sequences and collections, with an "All bookmarks" footer link to
 * /bookmarks. Sections hide when empty; the caller only renders this when at
 * least one of them has content.
 */
const LibraryBookshelfDropdown = ({anchorEl, continueReading, savedBookmarks, onDismiss, onClose}: {
  anchorEl: HTMLElement | null,
  continueReading: ContinueReadingQueryQuery_ContinueReading_RecommendResumeSequence[],
  savedBookmarks: BookmarksBookshelfItemFragment[],
  onDismiss: (postId: string) => void,
  onClose: () => void,
}) => {
  const classes = useStyles(styles);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const savedItems = savedBookmarks.filter(bookmark => bookmark.sequence || bookmark.collection);

  return <LWPopper open={true} anchorEl={anchorEl} placement="bottom-end">
    <LWClickAwayListener onClickAway={onClose}>
      <div className={classes.dropdown}>
        <div className={classes.scrollArea}>
          {continueReading.length > 0 && <>
            <div className={classes.sectionHeader}>Continue Reading</div>
            {continueReading.map(entry => <BookshelfContinueReadingRow
              key={(entry.sequence ?? entry.collection)?._id ?? entry.nextPost._id}
              entry={entry}
              onDismiss={onDismiss}
            />)}
          </>}
          {savedItems.length > 0 && <>
            <div className={classNames(
              classes.sectionHeader,
              continueReading.length > 0 && classes.savedHeaderDivider,
            )}>
              Saved Sequences
            </div>
            {savedItems.map(bookmark => <BookshelfSavedRow key={bookmark._id} bookmark={bookmark} />)}
          </>}
        </div>
        <Link to="/bookmarks" className={classes.footer}>
          All bookmarks ›
        </Link>
      </div>
    </LWClickAwayListener>
  </LWPopper>;
};

export default LibraryBookshelfDropdown;
