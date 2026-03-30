import React from 'react';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import ContentStyles from '@/components/common/ContentStyles';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { headerStack, serifStack, sansSerifStack } from '@/themes/defaultPalette';
import { formatAuthor, formatScore, getCoreTags, getPostExcerptHtml } from './newspaperHelpers';

const INK = '#1A1A1A';
const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';

const styles = defineStyles('NewspaperHeroArticle', () => ({
  heroMain: {
    paddingRight: 40,
    borderRight: `1px solid ${RULE_COLOR}`,
    '@media (max-width: 900px)': {
      paddingRight: 0,
      borderRight: 'none',
      paddingBottom: 32,
      borderBottom: `1px solid ${RULE_COLOR}`,
    },
  },
  heroTitle: {
    fontFamily: headerStack,
    fontSize: '36px',
    fontWeight: 400,
    lineHeight: 1.2,
    marginBottom: 10,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
    '@media (max-width: 768px)': {
      fontSize: '28px',
    },
  },
  heroByline: {
    fontFamily: headerStack,
    fontWeight: 700,
    fontSize: '13px',
    color: INK_TERTIARY,
    marginBottom: 20,
    '& a': {
      color: INK_TERTIARY,
      textDecoration: 'none',
    },
  },
  heroExcerpt: {
    fontFamily: serifStack,
    fontSize: '17px',
    lineHeight: 1.75,
    color: INK,
    display: '-webkit-box',
    WebkitLineClamp: 12,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.9em',
    },
    '& a': {
      color: INK,
    },
    '& h1, & h2, & h3, & h4': {
      fontSize: '1.1em',
      marginBottom: '0.5em',
    },
  },
  heroMeta: {
    fontFamily: sansSerifStack,
    fontSize: '11px',
    color: INK_TERTIARY,
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  coreTag: {
    color: INK_TERTIARY,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}), { allowNonThemeColors: true });

const NewspaperHeroArticle = ({post}:{post: PostsListWithVotes}) => {
  const classes = useStyles(styles);
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);

  return <article className={classes.heroMain}>
    <h1 className={classes.heroTitle}>
      <Link to={url}>{post.title}</Link>
    </h1>
    <div className={classes.heroByline}>
      {formatAuthor(post)}
    </div>
    {excerptHtml && <ContentStyles contentType="postHighlight">
      <div className={classes.heroExcerpt}>
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: excerptHtml }}
          description={`(newspaper hero) ${post.title}`}
        />
      </div>
    </ContentStyles>}
    <div className={classes.heroMeta}>
      <span>
        {formatScore(post.baseScore ?? 0)}
        {getCoreTags(post).map(tag => <React.Fragment key={tag.slug}>{' · '}<Link to={`/tag/${tag.slug}`} className={classes.coreTag}>{tag.name}</Link></React.Fragment>)}
      </span>
      <span>
        {post.commentCount ?? 0} comments
      </span>
    </div>
  </article>;
};

export default NewspaperHeroArticle;
