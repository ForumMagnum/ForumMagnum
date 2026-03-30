import React from 'react';
import type { CoreTagGroup } from './newspaperHelpers';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';
import NewspaperHeroArticle from './NewspaperHeroArticle';
import NewspaperCardArticle from './NewspaperCardArticle';

const INK = '#1A1A1A';
const INK_TERTIARY = '#888888';
const RULE_DARK = '#333333';

const styles = defineStyles('NewspaperTagSection', () => ({
  tagSectionWrapper: {
    marginTop: 32,
  },
  container: {
    maxWidth: 1500,
    margin: '0 auto',
    padding: '0 48px',
    '@media (max-width: 768px)': {
      padding: '0 24px',
    },
  },
  tagSectionRule: {
    borderTop: `2px solid ${RULE_DARK}`,
    margin: 0,
  },
  tagLabel: {
    fontFamily: sansSerifStack,
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '4px',
    textTransform: 'uppercase',
    color: INK,
    textAlign: 'center',
    margin: '24px 0 4px 0',
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
  },
  tagLabelSubtext: {
    fontFamily: serifStack,
    fontSize: '13px',
    fontStyle: 'italic',
    color: INK_TERTIARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    gap: 0,
    marginTop: 32,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 0,
    paddingLeft: 0,
    '@media (max-width: 900px)': {
      paddingLeft: 0,
      marginTop: 24,
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto',
    },
  },
}), { allowNonThemeColors: true });

const NewspaperTagSection = ({group}: {group: CoreTagGroup}) => {
  const classes = useStyles(styles);
  const tagUrl = `/tag/${group.tagSlug}`;
  const cardPosts = group.otherPosts.slice(0, 4);
  return <div className={classes.tagSectionWrapper}>
    <div className={classes.container}>
      <hr className={classes.tagSectionRule} />
      <div className={classes.tagLabel}>
        <Link to={tagUrl}>{group.tagName}</Link>
      </div>
      <div className={classes.tagLabelSubtext}>
        {group.otherPosts.length + 1} articles this week
      </div>
      <div className={classes.heroSection}>
        <NewspaperHeroArticle post={group.heroPost} />
        <div className={classes.cardsGrid}>
          {cardPosts.map(post => <NewspaperCardArticle key={post._id} post={post} />)}
        </div>
      </div>
    </div>
  </div>;
};

export default NewspaperTagSection;
