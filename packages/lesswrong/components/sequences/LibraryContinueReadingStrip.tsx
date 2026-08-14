import React, { useRef, useState, MouseEvent } from 'react';
import sortBy from 'lodash/sortBy';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useCurrentUser } from '../common/withUser';
import { useContinueReading } from '../recommendations/withContinueReading';
import { useDismissRecommendation } from '../recommendations/withDismissRecommendation';
import LWTooltip from '../common/LWTooltip';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import PortraitCoverImage from './PortraitCoverImage';
import LibraryBookshelfDropdown from './LibraryBookshelfDropdown';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const LibraryBookshelfBookmarksQuery = gql(`
  query LibraryBookshelfBookmarksQuery($selector: BookmarkSelector, $limit: Int) {
    bookmarks(selector: $selector, limit: $limit) {
      results {
        ...BookmarksBookshelfItemFragment
      }
    }
  }
`);

/** Covers shown in the strip itself; further entries are only counted in "N more >" */
const STRIP_ITEM_COUNT = 4;

const COVER_WIDTH = 104;
const COVER_HEIGHT = 140;

const dismissRecommendationTooltip = "Don't remind me to finish reading this sequence unless I visit it again";

const styles = defineStyles('LibraryContinueReadingStrip', (theme: ThemeType) => ({
  root: {
    marginBottom: 32,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  label: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '.6px',
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
  },
  trigger: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  strip: {
    display: 'flex',
    gap: '14px',
    overflowX: 'auto',
  },
  item: {
    display: 'block',
    position: 'relative',
    flex: 'none',
    width: COVER_WIDTH,
    '&:hover $coverDismiss': {
      opacity: 1,
    },
  },
  cover: {
    // The design's book covers use a wider shadow than PortraitCoverImage's
    // default; double the class selector to win the specificity tie.
    '&&': {
      boxShadow: `0 1px 5px ${theme.palette.boxShadowColor(0.15)}`,
    },
  },
  coverDismiss: {
    position: 'absolute',
    top: 4,
    right: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 3px ${theme.palette.boxShadowColor(0.3)}`,
    color: theme.palette.text.dim,
    opacity: 0,
    transition: 'opacity .2s',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  coverDismissIcon: {
    fontSize: 14,
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    background: theme.palette.grey[300],
  },
  progressFill: {
    height: 4,
    background: theme.palette.primary.main,
  },
  progressLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1,
    color: theme.palette.primary.main,
  },
  startReadingButton: {
    display: 'block',
    marginTop: 6,
    padding: '4px 0',
    textAlign: 'center',
    background: 'light-dark(#f1f1f1, #333333)',
    borderRadius: 6,
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    color: theme.palette.greyAlpha(0.87),
    '&:hover': {
      background: 'light-dark(#e7e7e7, #3d3d3d)',
    },
  },
  itemTitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '16px',
    marginTop: 4,
    color: theme.palette.text.dim,
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': 2,
    overflow: 'hidden',
  },
}));

const LibraryContinueReadingStrip = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  const dismissRecommendation = useDismissRecommendation();
  const [dismissedPostIds, setDismissedPostIds] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const labelRowRef = useRef<HTMLDivElement | null>(null);

  // Guests never have a bookshelf: don't render getResumeSequences' hardcoded
  // logged-out defaults (they carry no read progress and would show broken 0%
  // bars), and myBookmarks errors when logged out.
  const { continueReading, loading } = useContinueReading({skip: !currentUser});
  const { data: savedData, loading: savedLoading } = useQuery(LibraryBookshelfBookmarksQuery, {
    variables: {
      selector: { myBookmarks: { collectionNames: ["Sequences", "Collections"] } },
      limit: 100,
    },
    skip: !currentUser,
  });

  if (!currentUser || loading || savedLoading) {
    return null;
  }

  const sorted = sortBy(
    continueReading.filter(entry => !dismissedPostIds[entry.nextPost._id]),
    r => r.lastReadTime,
  ).reverse();
  const savedBookmarks = savedData?.bookmarks?.results ?? [];

  // The label row and dropdown trigger render whenever the user has ANY
  // bookshelf content (in-progress or saved); the covers strip additionally
  // requires continue-reading entries.
  if (!sorted.length && !savedBookmarks.length) {
    return null;
  }

  const shownEntries = sorted.slice(0, STRIP_ITEM_COUNT);
  const moreCount = sorted.length - shownEntries.length;

  const toggleDropdown = () => {
    const nowOpen = !dropdownOpen;
    setDropdownOpen(nowOpen);
    captureEvent('libraryBookshelfDropdownToggled', {open: nowOpen});
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleDropdown();
    }
  };

  const dismissEntry = (postId: string) => {
    void dismissRecommendation(postId);
    setDismissedPostIds(prev => ({...prev, [postId]: true}));
    captureEvent('continueReadingDismissed', {postId});
  };

  const handleCoverDismiss = (event: MouseEvent, postId: string) => {
    event.preventDefault();
    event.stopPropagation();
    dismissEntry(postId);
  };

  return <AnalyticsContext pageSectionContext="libraryContinueReading">
    <div className={classes.root}>
      <div className={classes.labelRow} ref={labelRowRef}>
        <span className={classes.label}>Continue Reading</span>
        <span
          className={classes.trigger}
          onClick={toggleDropdown}
          onKeyDown={handleTriggerKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={dropdownOpen}
        >
          {moreCount > 0 ? `${moreCount} more >` : 'Your bookshelf ›'}
        </span>
      </div>
      {shownEntries.length > 0 && <div className={classes.strip}>
        {shownEntries.map((entry) => {
          const item = entry.sequence ?? entry.collection;
          if (!item) {
            return null;
          }
          const progressPercent = entry.numTotal
            ? Math.round(100 * (entry.numRead ?? 0) / entry.numTotal)
            : 0;
          return <Link
            key={item._id}
            to={postGetPageUrl(entry.nextPost, false, entry.sequence?._id ?? null)}
            className={classes.item}
          >
            <PortraitCoverImage
              coverImageId={item.coverImageId}
              gridImageId={item.gridImageId}
              title={item.title ?? ""}
              width={COVER_WIDTH}
              height={COVER_HEIGHT}
              className={classes.cover}
            />
            <span
              className={classes.coverDismiss}
              onClick={(event) => handleCoverDismiss(event, entry.nextPost._id)}
            >
              <LWTooltip title={dismissRecommendationTooltip} placement="right">
                <CloseIcon className={classes.coverDismissIcon} />
              </LWTooltip>
            </span>
            {(entry.numRead ?? 0) > 0
              ? <div className={classes.progressRow}>
                  <div className={classes.progressTrack}>
                    <div className={classes.progressFill} style={{width: `${progressPercent}%`}} />
                  </div>
                  <span className={classes.progressLabel}>{progressPercent}%</span>
                </div>
              : <span className={classes.startReadingButton}>Start reading</span>}
            <div className={classes.itemTitle}>{item.title}</div>
          </Link>;
        })}
      </div>}
      {dropdownOpen && <LibraryBookshelfDropdown
        anchorEl={labelRowRef.current}
        continueReading={sorted}
        savedBookmarks={savedBookmarks}
        onDismiss={dismissEntry}
        onClose={() => setDropdownOpen(false)}
      />}
    </div>
  </AnalyticsContext>;
};

export default LibraryContinueReadingStrip;
