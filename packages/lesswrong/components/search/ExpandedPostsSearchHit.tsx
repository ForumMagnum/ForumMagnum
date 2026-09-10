import SearchHighlight from "./SearchHighlight";
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from "../../lib/reactRouterWrapper";
import { useNavigate } from "../../lib/routeUtil";
import FormatDate from "../common/FormatDate";
import UserNameDeleted from "../users/UserNameDeleted";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ExpandedPostsSearchHit", (theme: ThemeType) => ({
  root: {
    position: "relative",
    maxWidth: 600,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18,
    cursor: 'pointer',
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
}))

const ExpandedPostsSearchHit = ({hit, icon}: {
  hit: Hit<any>,
  icon?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const post: SearchPost = hit
  
  const handleClick = () => {
    navigate(postGetPageUrl(post))
  }

  return <div className={classes.root} onClick={handleClick}>
    {icon}
    <div className={classes.title}>
      <Link to={postGetPageUrl(post)} className={classes.link} onClick={(e) => e.stopPropagation()}>
        <SearchHighlight hit={hit} attribute="title">{post.title}</SearchHighlight>
      </Link>
    </div>
    <div className={classes.metaInfoRow}>
      {post.authorSlug ? <Link to={userGetProfileUrlFromSlug(post.authorSlug)} onClick={(e) => e.stopPropagation()}>
        <SearchHighlight hit={hit} attribute="authorDisplayName">{post.authorDisplayName}</SearchHighlight>
      </Link> : <UserNameDeleted />}
      <span>{post.baseScore ?? 0} karma</span>
      <span>{post.commentCount ?? 0} comment{post.commentCount === 1 ? "" : "s"}</span>
      <FormatDate date={post.postedAt} />
    </div>
    <div className={classes.snippet}>
      <Snippet className={classes.snippet} attribute="body" hit={post} tagName="mark" />
    </div>
  </div>
}

export default ExpandedPostsSearchHit;



