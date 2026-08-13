import React from 'react';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import LibraryContinueReadingStrip from './LibraryContinueReadingStrip';
import LibraryRecommendedZone from './LibraryRecommendedZone';
import LibraryAllSequencesList from './LibraryAllSequencesList';
import SequencesNewButton from './SequencesNewButton';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LibraryRedesignPage', (theme: ThemeType) => ({
  root: {
    maxWidth: 805,
    marginLeft: 'auto',
    marginRight: 'auto',
    // Lift the page above the site-wide LWBackgroundImage overlay, which
    // otherwise intercepts clicks (SingleColumnSection does the same).
    position: 'relative',
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
  titleBlock: {
    borderTop: `3px solid ${theme.palette.greyAlpha(0.75)}`,
    paddingTop: 14,
    marginBottom: 22,
  },
  title: {
    margin: 0,
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: 40,
    fontWeight: 500,
    lineHeight: 1.1,
    textTransform: 'uppercase',
    letterSpacing: '.01em',
    color: theme.palette.greyAlpha(0.7),
  },
  allSequencesSection: {
    borderTop: theme.palette.border.faint,
    marginTop: 28,
    paddingTop: 20,
  },
  allSequencesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  allSequencesLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: '.6px',
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
  },
}));

const LibraryRedesignPage = () => {
  const classes = useStyles(styles);

  return <AnalyticsContext pageContext="sequencesHome">
    <div className={classes.root}>
      <div className={classes.titleBlock}>
        <h1 className={classes.title}>The Library</h1>
      </div>
      <LibraryContinueReadingStrip />
      <LibraryRecommendedZone />
      <AnalyticsContext pageSectionContext="libraryAllSequences">
        <div className={classes.allSequencesSection}>
          <div className={classes.allSequencesHeader}>
            <span className={classes.allSequencesLabel}>All Sequences</span>
            <SequencesNewButton />
          </div>
          <LibraryAllSequencesList />
        </div>
      </AnalyticsContext>
    </div>
  </AnalyticsContext>;
};

export default LibraryRedesignPage;
