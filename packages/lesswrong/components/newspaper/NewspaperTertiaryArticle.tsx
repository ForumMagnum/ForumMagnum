import React from 'react';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';
import NewspaperJustifiedText from './NewspaperJustifiedText';
import { formatAuthor, formatScore, getPostExcerptHtml } from './newspaperHelpers';

const INK = '#1A1A1A';
const INK_SECONDARY = '#555555';
const INK_TERTIARY = '#888888';


const styles = defineStyles('NewspaperTertiaryArticle', () => ({
  tertiaryArticle: {
    padding: '20px 24px',
    backgroundColor: '#FFFFFF',
  },
  tertiaryTitle: {
    fontFamily: headerStack,
    fontSize: '19px',
    fontWeight: 400,
    lineHeight: 1.25,
    marginBottom: 6,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
  },
  tertiaryByline: {
    fontFamily: headerStack,
    fontWeight: 700,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginBottom: 10,
  },
  tertiaryExcerpt: {
    fontFamily: serifStack,
    fontSize: '15px',
    lineHeight: 1.6,
    color: INK_SECONDARY,
    overflow: 'hidden',
  },
  tertiaryMeta: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginTop: 10,
  },
}), { allowNonThemeColors: true });

const NewspaperTertiaryArticle = ({post}:{post: PostsListWithVotes}) => {
  const classes = useStyles(styles);
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);

  return <article className={classes.tertiaryArticle}>
    <h3 className={classes.tertiaryTitle}>
      <Link to={url}>{post.title}</Link>
    </h3>
    <div className={classes.tertiaryByline}>
      {formatAuthor(post)}
    </div>
    {excerptHtml && <div className={classes.tertiaryExcerpt}>
      <NewspaperJustifiedText html={excerptHtml} maxLines={8} />
    </div>}
    <div className={classes.tertiaryMeta}>
      {formatScore(post.baseScore ?? 0)}, {post.commentCount ?? 0} comments
    </div>
  </article>;
};

export default NewspaperTertiaryArticle;
