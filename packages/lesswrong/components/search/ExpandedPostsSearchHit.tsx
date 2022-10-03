import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 700,
    padding: 10,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18
  },
  link: {
    display: 'block',
  },
  title: {
    fontSize: 18,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.grey[800],
    fontWeight: 600,
    marginBottom: 3
  },
  metaInfoRow: {
    display: "flex",
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 16,
    rowGap: '3px',
    color: theme.palette.grey[600],
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
  },
  metaInfo: {
    display: "flex",
    alignItems: 'center',
    columnGap: 3
  },
  snippet: {
    overflowWrap: "break-word",
    fontFamily: theme.typography.fontFamily,
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    marginTop: 7
  }
})

const isLeftClick = (event: React.MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const ExpandedPostsSearchHit = ({hit, clickAction, classes}: {
  hit: Hit<any>,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const { FormatDate } = Components
  const post: AlgoliaPost = hit

  return <div className={classes.root}>
    <Link
      to={postGetPageUrl(post)}
      onClick={(event: React.MouseEvent) => isLeftClick(event) && clickAction && clickAction()}
      className={classes.link}
    >
      <div className={classes.title}>
        {post.title}
      </div>
      <div className={classes.metaInfoRow}>
        <span>{post.authorDisplayName}</span>
        <span>{post.baseScore ?? 0} karma</span>
        <FormatDate date={post.createdAt} />
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="body" hit={post} tagName="mark" />
      </div>
    </Link>
  </div>
}

const ExpandedPostsSearchHitComponent = registerComponent("ExpandedPostsSearchHit", ExpandedPostsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedPostsSearchHit: typeof ExpandedPostsSearchHitComponent
  }
}

