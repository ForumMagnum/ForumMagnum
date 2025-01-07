import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 600,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.5
    }
  },
  link: {
    '&:hover': {
      opacity: 1
    }
  },
  title: {
    fontSize: 18,
    lineHeight: '24px',
    fontFamily: theme.typography.fontFamily,
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

const ExpandedPostsSearchHit = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const { FormatDate, UserNameDeleted } = Components
  const post: SearchPost = hit
  
  const handleClick = () => {
    navigate(postGetPageUrl(post))
  }

  return <div className={classes.root} onClick={handleClick}>
    <div className={classes.title}>
      <Link to={postGetPageUrl(post)} className={classes.link} onClick={(e) => e.stopPropagation()}>
        {post.title}
      </Link>
    </div>
    <div className={classes.metaInfoRow}>
      {post.authorSlug ? <Link to={userGetProfileUrlFromSlug(post.authorSlug)} onClick={(e) => e.stopPropagation()}>
        {post.authorDisplayName}
      </Link> : <UserNameDeleted />}
      <span>{post.baseScore ?? 0} karma</span>
      <FormatDate date={post.postedAt} />
    </div>
    <div className={classes.snippet}>
      <Snippet className={classes.snippet} attribute="body" hit={post} tagName="mark" />
    </div>
  </div>
}

const ExpandedPostsSearchHitComponent = registerComponent("ExpandedPostsSearchHit", ExpandedPostsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedPostsSearchHit: typeof ExpandedPostsSearchHitComponent
  }
}

