import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl, userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 600,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18
  },
  link: {
    display: 'block',
  },
  title: {
    fontSize: 18,
    lineHeight: '24px',
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.grey[800],
    fontWeight: 600,
    marginBottom: 2
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
    fontFamily: theme.typography.postStyle.fontFamily,
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: '22px',
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
  const { FormatDate, UserNameDeleted } = Components
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
        {post.authorSlug ? <Link to={userGetProfileUrlFromSlug(post.authorSlug)}>{post.authorDisplayName}</Link> : <UserNameDeleted />}
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

