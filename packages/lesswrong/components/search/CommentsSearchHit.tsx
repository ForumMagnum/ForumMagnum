import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { Snippet } from 'react-instantsearch-dom';
import React from 'react';
import ChatBubbleOutlineIcon from '@/lib/vendor/@material-ui/icons/src/ChatBubbleOutline';
import { tagGetCommentLink } from '../../lib/collections/tags/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import type { SearchHitComponentProps } from './types';
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import LWTooltip from "../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    color: theme.palette.grey[600],
    marginRight: 12,
    marginLeft: 4
  },
  snippet: {
    overflowWrap: "break-word",
    ...theme.typography.body2,
    wordBreak: "break-word",
    color: theme.palette.grey[600],
  }
})

const isLeftClick = (event: React.MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const CommentsSearchHit = ({hit, clickAction, classes, showIcon=false}: SearchHitComponentProps) => {
  const comment = (hit as SearchComment);
  let url = "";
  if (comment.postId && comment.postSlug) {
    url = `${postGetPageUrl({
      _id: comment.postId ?? "",
      slug: comment.postSlug ?? "",
      isEvent: comment.postIsEvent,
      groupId: comment.postGroupId,
    })}#${comment._id}`;
  } else if (comment.tagSlug && comment.tagCommentType) {
    url = tagGetCommentLink({tagSlug: comment.tagSlug, commentId: comment._id, tagCommentType: comment.tagCommentType})
  }

  return <div className={classes.root}>
    {showIcon && <LWTooltip title="Comment">
      <ChatBubbleOutlineIcon className={classes.icon}/>
    </LWTooltip>}
    <Link to={url} onClick={(event: React.MouseEvent) => isLeftClick(event) && clickAction && clickAction()}>
      <div>
        <MetaInfo>{comment.authorDisplayName}</MetaInfo>
        <MetaInfo>{comment.baseScore} karma </MetaInfo>
        <MetaInfo>
          <FormatDate date={comment.postedAt}/>
        </MetaInfo>
      </div>
      <div className={classes.snippet}>
        <Snippet className={classes.snippet} attribute="body" hit={comment} tagName="mark" />
      </div>
    </Link>
  </div>
}

export default registerComponent("CommentsSearchHit", CommentsSearchHit, {styles});



