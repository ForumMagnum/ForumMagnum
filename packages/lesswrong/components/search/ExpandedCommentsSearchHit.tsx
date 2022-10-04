import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { tagGetCommentLink } from '../../lib/collections/tags/helpers';
import { TagCommentType } from '../../lib/collections/comments/types';
import TagIcon from '@material-ui/icons/LocalOffer';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 700,
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 18
  },
  link: {
    display: 'block',
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
    marginBottom: 3
  },
  author: {
    fontSize: 16,
    fontFamily: theme.typography.postStyle.fontFamily,
    color: theme.palette.grey[800],
    fontWeight: 600,
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
    color: theme.palette.grey[600],
    fontSize: 12,
    lineHeight: '16px',
    fontFamily: theme.typography.fontFamily,
  },
  tagIcon: {
    fontSize: 12,
    color: theme.palette.grey[500],
  },
  snippet: {
    overflowWrap: "break-word",
    fontFamily: theme.typography.fontFamily,
    wordBreak: "break-word",
    fontSize: 14,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    marginTop: 5
  }
})

const isLeftClick = (event: React.MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const ExpandedCommentsSearchHit = ({hit, clickAction, classes}: {
  hit: Hit<any>,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const { FormatDate } = Components
  const comment: AlgoliaComment = hit
  
  let url = "";
  if (comment.tagSlug && comment.tagCommentType) {
    url = tagGetCommentLink(comment.tagSlug, comment._id, comment.tagCommentType as TagCommentType);
  } else if (comment.postId && comment.postSlug) {
    url = `${postGetPageUrl({
      _id: comment.postId ?? "",
      slug: comment.postSlug ?? "",
      isEvent: comment.postIsEvent,
      groupId: comment.postGroupId,
    })}#${comment._id}`;
  }

  return <div className={classes.root}>
    <Link
      to={url}
      onClick={(event: React.MouseEvent) => isLeftClick(event) && clickAction && clickAction()}
      className={classes.link}
    >
      <div className={classes.authorRow}>
        <span className={classes.author}>{comment.authorDisplayName}</span>
        <span>{comment.baseScore ?? 0} karma</span>
        <FormatDate date={comment.createdAt} />
      </div>
      {comment.postTitle && <div className={classes.title}>
        {comment.postTitle}
      </div>}
      {comment.tagName && <div className={classes.title}>
        <TagIcon className={classes.tagIcon} />
        {comment.tagName}
      </div>}
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="body" hit={comment} tagName="mark" />
      </div>
    </Link>
  </div>
}

const ExpandedCommentsSearchHitComponent = registerComponent("ExpandedCommentsSearchHit", ExpandedCommentsSearchHit, {styles});

declare global {
  interface ComponentTypes {
    ExpandedCommentsSearchHit: typeof ExpandedCommentsSearchHitComponent
  }
}

