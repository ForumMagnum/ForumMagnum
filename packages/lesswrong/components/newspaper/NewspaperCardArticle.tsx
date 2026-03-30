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
const INK_SECONDARY = '#555555';
const INK_TERTIARY = '#888888';
const RULE_COLOR = '#DDDDDD';

const styles = defineStyles('NewspaperCardArticle', () => ({
  card: {
    padding: '0 20px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    '&:nth-child(1)': {
      borderRight: `1px solid ${RULE_COLOR}`,
      borderBottom: `1px solid ${RULE_COLOR}`,
    },
    '&:nth-child(2)': {
      borderBottom: `1px solid ${RULE_COLOR}`,
    },
    '&:nth-child(3)': {
      borderRight: `1px solid ${RULE_COLOR}`,
    },
    '@media (max-width: 600px)': {
      borderRight: 'none !important',
      borderBottom: `1px solid ${RULE_COLOR} !important`,
      '&:last-child': {
        borderBottom: 'none !important',
      },
    },
  },
  cardTitle: {
    fontFamily: headerStack,
    fontWeight: 400,
    lineHeight: 1.25,
    marginBottom: 6,
    marginTop: 20,
    minHeight: 55,
    color: INK,
    '& a': {
      color: INK,
      textDecoration: 'none',
    },
  },
  cardByline: {
    fontFamily: headerStack,
    fontWeight: 700,
    fontSize: '12px',
    color: INK_TERTIARY,
    marginBottom: 12,
  },
  cardExcerpt: {
    fontFamily: serifStack,
    fontSize: '15px',
    lineHeight: 1.6,
    color: INK_SECONDARY,
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 8,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    '& p': {
      marginBottom: '0.5em',
    },
    '& a': {
      color: INK_SECONDARY,
    },
    '& h1, & h2, & h3, & h4': {
      fontSize: '1em',
      marginBottom: '0.4em',
    },
  },
  cardMeta: {
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

const titleFontSizeTiers: [number, number][] = [
  [30, 28],
  [55, 24],
  [80, 21],
  [110, 18],
];

function getTitleFontSize(title: string): number {
  const len = title.length;
  for (const [maxLen, size] of titleFontSizeTiers) {
    if (len <= maxLen) return size;
  }
  return 15;
}

const NewspaperCardArticle = ({post}:{post: PostsListWithVotes}) => {
  const classes = useStyles(styles);
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);
  const titleFontSize = getTitleFontSize(post.title);

  return <article className={classes.card}>
    <h2 className={classes.cardTitle} style={{ fontSize: titleFontSize }}>
      <Link to={url}>{post.title}</Link>
    </h2>
    <div className={classes.cardByline}>
      {formatAuthor(post)}
    </div>
    {excerptHtml && <ContentStyles contentType="postHighlight">
      <div className={classes.cardExcerpt}>
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: excerptHtml }}
          description={`(newspaper card) ${post.title}`}
        />
      </div>
    </ContentStyles>}
    <div className={classes.cardMeta}>
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

export default NewspaperCardArticle;
