import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';
import { Snippet } from 'react-instantsearch-dom';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { tagGetCommentLink } from '../../lib/collections/tags/helpers';
import TagIcon from '@/lib/vendor/@material-ui/icons/src/LocalOffer';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from "../../lib/reactRouterWrapper";
import { useNavigate } from "../../lib/routeUtil";

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
})

const ExpandedCommentsSearchHitInner = ({hit, classes}: {
  hit: Hit<any>,
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const { FormatDate, UserNameDeleted } = Components
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
  
  const handleClick = () => {
    navigate(url)
  }

  return <div className={classes.root} onClick={handleClick}>
    <Link to={url} className={classes.link} onClick={(e) => e.stopPropagation()}>
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
    </Link>
    <div className={classes.authorRow}>
      {comment.authorSlug ? <Link to={userGetProfileUrlFromSlug(comment.authorSlug)} onClick={(e) => e.stopPropagation()}>
        {comment.authorDisplayName}
      </Link> : <UserNameDeleted />}
      <span>{comment.baseScore ?? 0} karma</span>
      <FormatDate date={comment.createdAt} />
    </div>
  </div>
}

export const ExpandedCommentsSearchHit = registerComponent("ExpandedCommentsSearchHit", ExpandedCommentsSearchHitInner, {styles});

declare global {
  interface ComponentTypes {
    ExpandedCommentsSearchHit: typeof ExpandedCommentsSearchHit
  }
}

