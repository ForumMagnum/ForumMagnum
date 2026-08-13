import React from 'react';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useContinueReading } from '../recommendations/withContinueReading';
import PortraitCoverImage from './PortraitCoverImage';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

/** Covers shown in the strip itself; further entries are only counted in "N more >" */
const STRIP_ITEM_COUNT = 4;

const FIRST_COVER_WIDTH = 118;
const FIRST_COVER_HEIGHT = 159;
const COVER_WIDTH = 104;
const COVER_HEIGHT = 140;

const styles = defineStyles('LibraryContinueReadingStrip', (theme: ThemeType) => ({
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
  // TODO: becomes the trigger for the bookshelf dropdown when that gets built
  moreLink: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
  },
  strip: {
    display: 'flex',
    gap: '14px',
    marginBottom: 32,
    overflowX: 'auto',
  },
  item: {
    display: 'block',
    flex: 'none',
    width: COVER_WIDTH,
  },
  firstItem: {
    width: FIRST_COVER_WIDTH,
  },
  cover: {
    // The design's book covers use a wider shadow than PortraitCoverImage's
    // default; double the class selector to win the specificity tie.
    '&&': {
      boxShadow: `0 1px 5px ${theme.palette.boxShadowColor(0.15)}`,
    },
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
  const { continueReading, loading } = useContinueReading();

  if (loading || !continueReading.length) {
    return null;
  }

  const sorted = sortBy(continueReading, r => r.lastReadTime).reverse();
  const shownEntries = sorted.slice(0, STRIP_ITEM_COUNT);
  const moreCount = sorted.length - shownEntries.length;

  return <AnalyticsContext pageSectionContext="libraryContinueReading">
    <div>
      <div className={classes.labelRow}>
        <span className={classes.label}>Continue Reading</span>
        {moreCount > 0 && <span className={classes.moreLink}>{moreCount} more &gt;</span>}
      </div>
      <div className={classes.strip}>
        {shownEntries.map((entry, i) => {
          const item = entry.sequence ?? entry.collection;
          if (!item) {
            return null;
          }
          const progressPercent = entry.numTotal
            ? Math.round(100 * (entry.numRead ?? 0) / entry.numTotal)
            : 0;
          const width = i === 0 ? FIRST_COVER_WIDTH : COVER_WIDTH;
          const height = i === 0 ? FIRST_COVER_HEIGHT : COVER_HEIGHT;
          return <Link
            key={item._id}
            to={postGetPageUrl(entry.nextPost, false, entry.sequence?._id ?? null)}
            className={classNames(classes.item, i === 0 && classes.firstItem)}
          >
            <PortraitCoverImage
              coverImageId={item.coverImageId}
              gridImageId={item.gridImageId}
              title={item.title ?? ""}
              width={width}
              height={height}
              className={classes.cover}
            />
            <div className={classes.progressRow}>
              <div className={classes.progressTrack}>
                <div className={classes.progressFill} style={{width: `${progressPercent}%`}} />
              </div>
              <span className={classes.progressLabel}>{progressPercent}%</span>
            </div>
            <div className={classes.itemTitle}>{item.title}</div>
          </Link>;
        })}
      </div>
    </div>
  </AnalyticsContext>;
};

export default LibraryContinueReadingStrip;
