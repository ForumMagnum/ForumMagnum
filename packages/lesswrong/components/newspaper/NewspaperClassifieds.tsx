import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';

const INK = '#1A1A1A';
const INK_SECONDARY = '#555555';
const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';
const RULE_DARK = '#333333';

const styles = defineStyles('NewspaperClassifieds', () => ({
  belowFoldSection: {
    maxWidth: 765,
    margin: '0 auto',
    padding: '0 24px',
  },
  sectionRuleDark: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: '0',
  },
  belowFoldHeader: {
    fontFamily: headerStack,
    fontSize: '24px',
    fontWeight: 400,
    textAlign: 'center',
    margin: '32px 0 4px 0',
    letterSpacing: '1px',
    color: INK,
  },
  belowFoldSubheader: {
    fontFamily: serifStack,
    fontSize: '13px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  classifiedsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    border: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  classifiedItem: {
    padding: '16px 20px',
    borderRight: `1px solid ${RULE_COLOR}`,
    borderBottom: `1px solid ${RULE_COLOR}`,
    '&:nth-child(2n)': {
      borderRight: 'none',
    },
    '@media (max-width: 600px)': {
      borderRight: 'none',
    },
  },
  classifiedTitle: {
    fontFamily: sansSerifStack,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '2px',
    color: INK,
    marginBottom: 6,
  },
  classifiedBody: {
    fontFamily: serifStack,
    fontSize: '13px',
    lineHeight: 1.5,
    color: INK_SECONDARY,
    '& a': {
      color: INK,
      textDecoration: 'none',
      borderBottom: `1px solid ${RULE_COLOR}`,
      '&:hover': {
        borderBottomColor: INK,
      },
    },
  },
}), { allowNonThemeColors: true });

const NewspaperClassifieds = () => {
  const classes = useStyles(styles);
  return <div className={classes.belowFoldSection}>
    <hr className={classes.sectionRuleDark} />
    <div className={classes.belowFoldHeader}>The Classifieds</div>
    <div className={classes.belowFoldSubheader}>Community notices &amp; sundry announcements</div>
    <div className={classes.classifiedsGrid}>
      <div className={classes.classifiedItem}>
        <div className={classes.classifiedTitle}>ALL POSTS</div>
        <div className={classes.classifiedBody}>
          Browse the complete archive of posts, sorted by your preference.{' '}
          <Link to="/allPosts">Visit the archive &rarr;</Link>
        </div>
      </div>
      <div className={classes.classifiedItem}>
        <div className={classes.classifiedTitle}>COMMUNITY</div>
        <div className={classes.classifiedBody}>
          Find local meetups, reading groups, and events near you.{' '}
          <Link to="/community">Find your people &rarr;</Link>
        </div>
      </div>
      <div className={classes.classifiedItem}>
        <div className={classes.classifiedTitle}>LIBRARY</div>
        <div className={classes.classifiedBody}>
          Curated sequences and collections of LessWrong&rsquo;s best writing.{' '}
          <Link to="/library">Browse the stacks &rarr;</Link>
        </div>
      </div>
      <div className={classes.classifiedItem}>
        <div className={classes.classifiedTitle}>BEST OF</div>
        <div className={classes.classifiedBody}>
          The annual review selects the best posts. Read the winners.{' '}
          <Link to="/bestoflesswrong">See the best &rarr;</Link>
        </div>
      </div>
    </div>
  </div>;
};

export default NewspaperClassifieds;
