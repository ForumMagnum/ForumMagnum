import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { usePostForTooltip } from '@/components/hooks/usePostForTooltip';
import { useForumType } from '@/components/hooks/useForumType';
import { postGetKarma, postGetPageUrl } from '@/lib/collections/posts/helpers';
import { Link } from '@/lib/reactRouterWrapper';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import PostsUserAndCoauthors from '@/components/posts/PostsUserAndCoauthors';
import FormatDate from '@/components/common/FormatDate';
import Loading from '@/components/vulcan-core/Loading';
import { highlightSimplifiedStyles } from '@/components/posts/PostsPreviewTooltip/LWPostsPreviewTooltip';

const styles = defineStyles('ModerationCommentPostContext', (theme: ThemeType) => ({
  root: {
    padding: '12px 16px',
    borderBottom: theme.palette.border.normal,
    background: theme.palette.panelBackground.darken02,
  },
  title: {
    display: 'block',
    ...theme.typography.commentStyle,
    color: theme.palette.link.dim2,
  },
  metadata: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  highlight: {
    marginTop: 10,
    maxHeight: 240,
    overflowY: 'auto',
    paddingRight: 8,
    wordBreak: 'break-word',
    // Doubled `&` to beat the postHighlight ContentStyles sizes
    '&&': {
      fontSize: 14,
      lineHeight: '20px',
    },
    '&&, && p, && li, && blockquote, && h1, && h2, && h3, && h4': {
      fontFamily: theme.palette.fonts.sansSerifStack,
    },
    '&& li': {
      fontSize: 14,
      lineHeight: '20px',
    },
    '&& h1, && h2, && h3': {
      fontSize: 15,
    },
    ...highlightSimplifiedStyles,
  },
  continueReading: {
    ...theme.typography.commentStyle,
    display: 'block',
    marginTop: 8,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
}));

const ModerationCommentPostContext = ({ postId, showOpeningText }: {
  postId: string;
  showOpeningText: boolean;
}) => {
  const classes = useStyles(styles);
  const { forumType } = useForumType();
  const { loading, data } = usePostForTooltip(postId);
  const post = data?.post?.result;

  if (loading) {
    return <div className={classes.root}><Loading /></div>;
  }
  if (!post) {
    return null;
  }

  const highlight = post.contents?.htmlHighlight;

  return (
    <div className={classes.root}>
      <Link to={postGetPageUrl(post)} className={classes.title}>
        {post.title}
      </Link>
      <div className={classes.metadata}>
        <span>{postGetKarma(post, forumType)} karma</span>
        {post.user && <PostsUserAndCoauthors post={post} />}
        <FormatDate date={post.postedAt} />
      </div>
      {showOpeningText && highlight && (
        <ContentStyles contentType="postHighlight" className={classes.highlight}>
          <ContentItemBody
            dangerouslySetInnerHTML={{ __html: highlight }}
            description={`post ${post._id}`}
          />
          <Link to={postGetPageUrl(post)} className={classes.continueReading}>
            Continue reading
          </Link>
        </ContentStyles>
      )}
    </div>
  );
};

export default ModerationCommentPostContext;
