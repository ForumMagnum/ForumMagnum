import React from 'react';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import ContentStyles from '@/components/common/ContentStyles';
import { formatAuthor, formatScore, getPostExcerptHtml } from './newspaperHelpers';
import { newspaperStyles } from './newspaperStyles';

const TertiaryArticle = ({post, classes}:{post: PostsListWithVotes, classes: ClassesType<typeof newspaperStyles>}) => {
  const url = postGetPageUrl(post);
  const excerptHtml = getPostExcerptHtml(post);

  return <article className={classes.tertiaryArticle}>
    <h3 className={classes.tertiaryTitle}>
      <Link to={url}>{post.title}</Link>
    </h3>
    <div className={classes.tertiaryByline}>
      {formatAuthor(post)}
    </div>
    {excerptHtml && <ContentStyles contentType="postHighlight">
      <div className={classes.tertiaryExcerpt}>
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: excerptHtml }}
          description={`(newspaper tertiary) ${post.title}`}
        />
      </div>
    </ContentStyles>}
    <div className={classes.tertiaryMeta}>
      {formatScore(post.baseScore ?? 0)}, {post.commentCount ?? 0} comments
    </div>
  </article>;
};

const NewspaperMoreArticlesSection = ({classes, tertiaryPosts}:{classes: ClassesType<typeof newspaperStyles>, tertiaryPosts: PostsListWithVotes[]}) => {
  if (tertiaryPosts.length === 0) return null;

  return <div className={classes.container}>
    <hr className={classes.sectionRule} />
    <div className={classes.sectionHeader}>More Articles</div>
    <div className={classes.tertiaryGrid}>
      {tertiaryPosts.map(post => <TertiaryArticle key={post._id} post={post} classes={classes} />)}
    </div>
  </div>;
};

export default NewspaperMoreArticlesSection;
