import SearchResultRow from "./SearchResultRow";
import SearchHighlight from "./SearchHighlight";
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import FormatDate from "../common/FormatDate";
import UserNameDeleted from "../users/UserNameDeleted";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ExpandedPostsSearchHit", (theme: ThemeType) => ({
  root: {
    maxWidth: 600,
    paddingRight: 44,
    [theme.breakpoints.down('sm')]: {paddingRight: 0},
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 0,
    cursor: 'pointer',
  },
  title: {
    fontSize: 18,
    lineHeight: '24px',
    fontFamily: theme.typography.title.fontFamily,
    color: theme.palette.grey[800],
    fontWeight: 400,
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
}))

const ExpandedPostsSearchHit = ({hit, icon, compact}: {
  hit: Hit<any>,
  icon?: React.ReactNode,
  compact?: boolean,
}) => {
  const classes = useStyles(styles);
  const post: SearchPost = hit
  

  return <SearchResultRow href={postGetPageUrl(post)} label={post.title ?? "Post"} icon={icon} compact={compact} className={classes.root}>
    <div className={classes.title}>
      <span>
        <SearchHighlight hit={hit} attribute="title">{post.title}</SearchHighlight>
      </span>
    </div>
    <div className={classes.metaInfoRow}>
      {post.authorSlug ? <span>
        <SearchHighlight hit={hit} attribute="authorDisplayName">{post.authorDisplayName}</SearchHighlight>
      </span> : <UserNameDeleted />}
      <span>{post.baseScore ?? 0} karma</span>
      <span>{post.commentCount ?? 0} comment{post.commentCount === 1 ? "" : "s"}</span>
      <FormatDate date={post.postedAt} />
    </div>
    <div className={classes.snippet}>
      <Snippet className={classes.snippet} attribute="body" hit={post} tagName="mark" />
    </div>
  </SearchResultRow>
}

export default ExpandedPostsSearchHit;


