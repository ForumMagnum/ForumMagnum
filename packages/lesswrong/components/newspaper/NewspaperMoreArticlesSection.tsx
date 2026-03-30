import React from 'react';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { sansSerifStack } from '@/themes/defaultPalette';
import NewspaperTertiaryArticle from './NewspaperTertiaryArticle';

const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';

const styles = defineStyles('NewspaperMoreArticlesSection', () => ({
  container: {
    maxWidth: 1500,
    margin: '0 auto',
    padding: '0 48px',
    '@media (max-width: 768px)': {
      padding: '0 24px',
    },
  },
  sectionRule: {
    borderTop: `1px solid ${RULE_COLOR}`,
    margin: '0',
  },
  sectionHeader: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: INK_TERTIARY,
    textAlign: 'center',
    margin: '32px 0 24px 0',
  },
  tertiaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '1px',
    backgroundColor: RULE_COLOR,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
}), { allowNonThemeColors: true });

const NewspaperMoreArticlesSection = ({tertiaryPosts}:{tertiaryPosts: PostsListWithVotes[]}) => {
  const classes = useStyles(styles);
  if (tertiaryPosts.length === 0) return null;

  return <div className={classes.container}>
    <hr className={classes.sectionRule} />
    <div className={classes.sectionHeader}>More Articles</div>
    <div className={classes.tertiaryGrid}>
      {tertiaryPosts.map(post => <NewspaperTertiaryArticle key={post._id} post={post} />)}
    </div>
  </div>;
};

export default NewspaperMoreArticlesSection;
