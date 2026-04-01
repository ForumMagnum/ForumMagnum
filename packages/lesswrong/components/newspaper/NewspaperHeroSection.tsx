import React from 'react';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import NewspaperHeroArticle from './NewspaperHeroArticle';
import NewspaperCardArticle from './NewspaperCardArticle';

const RULE_COLOR = '#DDDDDD';

const styles = defineStyles('NewspaperHeroSection', () => ({
  container: {
    maxWidth: 1500,
    margin: '0 auto',
    padding: '0 48px',
    '@media (max-width: 768px)': {
      padding: '0 24px',
    },
  },
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 0,
    marginTop: 32,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 0,
    paddingLeft: 0,
    borderLeft: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 900px)': {
      paddingLeft: 0,
      borderLeft: 'none',
      marginTop: 24,
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto',
    },
  },
}), { allowNonThemeColors: true });

const NewspaperHeroSection = ({heroPost, cardPosts}:{heroPost: PostsListWithVotes|undefined, cardPosts: PostsListWithVotes[]}) => {
  const classes = useStyles(styles);
  if (!heroPost) return null;

  return <div className={classes.container}>
    <div className={classes.heroSection}>
      <NewspaperHeroArticle post={heroPost} />
      <div className={classes.cardsGrid}>
        {cardPosts.map(post => <NewspaperCardArticle key={post._id} post={post} />)}
      </div>
    </div>
  </div>;
};

export default NewspaperHeroSection;
