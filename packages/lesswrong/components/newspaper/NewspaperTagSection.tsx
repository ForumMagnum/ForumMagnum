import React from 'react';
import type { CoreTagGroup } from './newspaperHelpers';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import ContentStyles from '@/components/common/ContentStyles';
import { formatAuthor, formatScore, getPostExcerptHtml } from './newspaperHelpers';
import { newspaperStyles } from './newspaperStyles';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';

const TagCardArticle = ({post, classes}: {post: PostsListWithVotes, classes: ClassesType<typeof newspaperStyles>}) => {
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);
  return <article className={classes.card}>
    <h2 className={classes.cardTitle}>
      <Link to={url}>{post.title}</Link>
    </h2>
    <div className={classes.cardByline}>{formatAuthor(post)}</div>
    {excerptHtml && <ContentStyles contentType="postHighlight">
      <div className={classes.cardExcerpt}>
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: excerptHtml }}
          description={`(newspaper tag card) ${post.title}`}
        />
      </div>
    </ContentStyles>}
    <div className={classes.cardMeta}>
      {formatScore(post.baseScore ?? 0)}, {post.commentCount ?? 0} comments
    </div>
  </article>;
};

const NewspaperTagSection = ({group, classes}: {group: CoreTagGroup, classes: ClassesType<typeof newspaperStyles>}) => {
  const heroPost = group.heroPost;
  const heroUrl = postGetPageUrl(heroPost);
  const heroExcerpt = getPostExcerptHtml(heroPost);
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
        <article className={classes.heroMain}>
          <h1 className={classes.heroTitle}>
            <Link to={heroUrl}>{heroPost.title}</Link>
          </h1>
          <div className={classes.heroByline}>{formatAuthor(heroPost)}</div>
          {heroExcerpt && <ContentStyles contentType="postHighlight">
            <div className={classes.heroExcerpt}>
              <ContentItemBody
                dangerouslySetInnerHTML={{ __html: heroExcerpt }}
                description={`(newspaper tag hero) ${heroPost.title}`}
              />
            </div>
          </ContentStyles>}
          <div className={classes.heroMeta}>
            {formatScore(heroPost.baseScore ?? 0)}, {heroPost.commentCount ?? 0} comments
          </div>
        </article>
        <div className={classes.cardsGrid}>
          {cardPosts.map(post => <TagCardArticle key={post._id} post={post} classes={classes} />)}
        </div>
      </div>
    </div>
  </div>;
};

export default NewspaperTagSection;
