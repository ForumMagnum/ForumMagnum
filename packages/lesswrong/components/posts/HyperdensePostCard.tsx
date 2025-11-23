"use client";

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { useNavigate } from '@/lib/routeUtil';
import { Link } from '@/lib/reactRouterWrapper';
import PostsUserAndCoauthors from '@/components/posts/PostsUserAndCoauthors';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { truncate } from '@/lib/editor/ellipsize';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import ContentStyles from '../common/ContentStyles';

const styles = defineStyles('HyperdensePostCard', (theme: ThemeType) => ({
  card: {
    background: theme.palette.grey[0],
    ...commentBodyStyles(theme),
    padding: 10,
    cursor: 'pointer',
    boxShadow: theme.palette.boxShadow.lwCard,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    transition: 'all 0.2s ease-in-out',
  },
  cardExpanded: {
    zIndex: 10,
  },
  title: {
    ...theme.typography.title,
    fontSize: 32,
    textWrap: 'balance',
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 3,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
  },
  meta: {
    borderTop: `1px solid ${theme.palette.grey[400]}`,
    paddingTop: 6,
    marginTop: 6,
    fontSize: 12,
    color: theme.palette.grey[600],
    marginBottom: 4,
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  karma: {
    fontWeight: 600,
    flexShrink: 0,
  },
  tags: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexGrow: 1,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 1.3,
    color: theme.palette.grey[700],
  },
  preview: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    // WebkitLineClamp: 10,
    WebkitBoxOrient: 'vertical',
    maxHeight: 220,
    transition: 'max-height 0.3s ease-in-out',
    '& p': {
      marginTop: '.5em',
      marginBottom: '.5em',
      '&:first-child': {
        marginTop: 0,
      },
      '&:last-child': {
        marginBottom: 0,
      },
    },
    '& img': {
      display: 'none',
    },
    '& a': {
      pointerEvents: 'none',
      color: 'inherit',
      textDecoration: 'none',
    },
    '& blockquote': {
      fontSize: 14,
      lineHeight: 1.4,
    },
    '& ul': {
      margin: 0,
      padding: 0,
      listStyle: 'none',
    },
    '& ol': {
      margin: 0,
      padding: 0,
      listStyle: 'none',
    },
    '& li': {
      margin: 0,
      padding: 0,
      lineHeight: 1.3,
      fontSize: 14,
    },
    '& h1': {
      fontSize: 14,
      lineHeight: 1.3,
      fontWeight: 600,
      marginBottom: 3,
    },
    '& h2': {
      fontSize: 14,
      lineHeight: 1.3,
      fontWeight: 600,
      marginBottom: 3,
    },
    '& h3': {
      fontSize: 14,
      lineHeight: 1.3,
      fontWeight: 600,
      marginBottom: 3,
    },

  },
  previewExpanded: {
    maxHeight: 5000,
  },
}));

const HyperdensePostCard = ({post, baseHeight, isExpanded, onToggle}: {post: PostsListWithVotes, baseHeight: number, isExpanded: boolean, onToggle: () => void}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const postUrl = postGetPageUrl(post);
  
  const htmlHighlight = post.contents?.htmlHighlight || post.customHighlight?.html || '';
  const tagNames = (post.tags ?? []).map(tag => tag.name).filter((name): name is string => !!name);
  const visibleTags = tagNames.slice(0, 3);

  return (
    <div className={classNames(classes.card, isExpanded ? classes.cardExpanded : '')} onClick={onToggle}>
      <div className={classes.title}>
        <Link to={postUrl}>{post.title}</Link>
      </div>
      <div className={classNames(classes.preview, isExpanded ? classes.previewExpanded : '')}>
        <ContentStyles
          contentType="comment"
          className={classes.previewContent}
        >
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: htmlHighlight}}
            description={`post ${post._id} preview`}
          />
        </ContentStyles>
      </div>
      <div className={classes.meta}>
        <span className={classes.karma}>{post.baseScore}</span>
        <PostsUserAndCoauthors post={post} abbreviateIfLong={true} simple={true} />
        {visibleTags.length > 0 && (
          <span className={classes.tags}>{visibleTags.join(', ')}</span>
        )}
      </div>
    </div>
  );
};

export default HyperdensePostCard;

