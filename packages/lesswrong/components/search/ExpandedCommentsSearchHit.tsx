import SearchResultLink from "./SearchResultLink";
import SearchHighlight from "./SearchHighlight";
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { tagGetCommentLink } from '../../lib/collections/tags/helpers';
import TagIcon from '@/lib/vendor/@material-ui/icons/src/LocalOffer';
import FormatDate from "../common/FormatDate";
import UserNameDeleted from "../users/UserNameDeleted";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ExpandedCommentsSearchHit", (theme: ThemeType) => ({
  root: {
    position: "relative",
    maxWidth: 600,
    paddingRight: 44,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18,
    cursor: 'pointer',
  },
  authorRow: {
    display: "flex",
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 16,
    rowGap: '3px',
    color: theme.palette.grey[600],
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    marginTop: 6
  },
  metaInfo: {
    display: "flex",
    alignItems: 'center',
    columnGap: 3
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 6,
    fontSize: 15,
    lineHeight: '22px',
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    fontWeight: 600,
  },
  tagIcon: {
    fontSize: 14,
    color: theme.palette.grey[600],
  },
  snippet: {
    overflowWrap: "break-word",
    fontFamily: theme.typography.fontFamily,
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: '21px',
    color: theme.palette.grey[700],
    marginTop: 5
  }
}))

const ExpandedCommentsSearchHit = ({hit, icon}: {
  hit: Hit<any>,
  icon?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const comment: SearchComment = hit
  
  let url = "";
  if (comment.postId && comment.postSlug) {
    url = `${postGetPageUrl({
      _id: comment.postId ?? "",
      slug: comment.postSlug ?? "",
      isEvent: comment.postIsEvent,
      groupId: comment.postGroupId,
    })}#${comment._id}`
  } else if (comment.tagSlug && comment.tagCommentType) {
    url = tagGetCommentLink({tagSlug: comment.tagSlug, commentId: comment._id, tagCommentType: comment.tagCommentType})
  }
  

  return <div className={classes.root}>
    <SearchResultLink href={url} label={comment.postTitle ?? comment.tagName ?? "Comment"} />
    {icon}
    <div>
      {comment.postTitle && <div className={classes.title}>
        {comment.postTitle}
      </div>}
      {!comment.postTitle && comment.tagName && <div className={classes.title}>
        <TagIcon className={classes.tagIcon} />
        {comment.tagName}
      </div>}
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="body" hit={comment} tagName="mark" />
      </div>
    </div>
    <div className={classes.authorRow}>
      {comment.authorSlug ? <span>
        <SearchHighlight hit={hit} attribute="authorDisplayName">{comment.authorDisplayName}</SearchHighlight>
      </span> : <UserNameDeleted />}
      <span>{comment.baseScore ?? 0} karma</span>
      <FormatDate date={comment.createdAt} />
    </div>
  </div>
}

export default ExpandedCommentsSearchHit;



