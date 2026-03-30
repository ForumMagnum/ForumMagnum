import React from 'react';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import ContentStyles from '@/components/common/ContentStyles';
import { formatAuthor, formatScore, getPostExcerptHtml } from './newspaperHelpers';
import { newspaperStyles } from './newspaperStyles';

const HeroArticle = ({post, classes}:{post: PostsListWithVotes, classes: ClassesType<typeof newspaperStyles>}) => {
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
      {formatScore(post.baseScore ?? 0)}, {post.commentCount ?? 0} comments
    </div>
  </article>;
};

const CardArticle = ({post, classes}:{post: PostsListWithVotes, classes: ClassesType<typeof newspaperStyles>}) => {
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);

  return <article className={classes.card}>
    <h2 className={classes.cardTitle}>
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
      {formatScore(post.baseScore ?? 0)}, {post.commentCount ?? 0} comments
    </div>
  </article>;
};

const NewspaperHeroSection = ({classes, heroPost, cardPosts}:{classes: ClassesType<typeof newspaperStyles>, heroPost: PostsListWithVotes|undefined, cardPosts: PostsListWithVotes[]}) => {
  if (!heroPost) return null;

  return <div className={classes.container}>
    <div className={classes.heroSection}>
      <HeroArticle post={heroPost} classes={classes} />
      <div className={classes.cardsGrid}>
        {cardPosts.map(post => <CardArticle key={post._id} post={post} classes={classes} />)}
      </div>
    </div>
  </div>;
};

export default NewspaperHeroSection;
