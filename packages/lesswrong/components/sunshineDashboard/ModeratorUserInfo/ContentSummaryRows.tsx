import classNames from 'classnames';
import React, { useState } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import * as _ from 'underscore'
import MessageIcon from '@material-ui/icons/Message'
import DescriptionIcon from '@material-ui/icons/Description'

const styles = (theme: ThemeType): JssStyles => ({
  contentSummaryRow: {
    display: "flex",
    flexWrap: "wrap",
  },
  sortButton: {
    marginLeft: 6,
    cursor: "pointer",
    color: theme.palette.grey[600]
  },
  sortSelected: {
    color: theme.palette.grey[900]
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  hoverPostIcon: {
    height: 16,
    color: theme.palette.grey[700],
    position: "relative",
    top: 3
  },
});

export const ContentSummaryRows = ({classes, comments, posts, user, loading}: {
  classes: ClassesType,
  comments: CommentsListWithParentMetadata[],
  posts: SunshinePostsList[],
  user: SunshineUsersList,
  loading: boolean
}) => {
  const { LWTooltip, PostKarmaWithPreview, CommentKarmaWithPreview, Loading } = Components 
  const [contentSort, setContentSort] = useState<'baseScore' | 'postedAt'>("postedAt")

  const commentKarmaPreviews = comments ? _.sortBy(comments, contentSort) : []
  const postKarmaPreviews = posts ? _.sortBy(posts, contentSort) : []
  
  const hiddenPostCount = user.maxPostCount - user.postCount
  const hiddenCommentCount = user.maxCommentCount - user.commentCount

  return <div>
    <div>
      Sort by: <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "baseScore"})} onClick={() => setContentSort("baseScore")}>
          karma
        </span>
      <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "postedAt"})} onClick={() => setContentSort("postedAt")}>
          postedAt
      </span>
    </div>

    {loading && <Loading/>}

    <div className={classes.contentSummaryRow}>
      <LWTooltip title="Post count">
        <span>
          { user.postCount || 0 }
          <DescriptionIcon className={classes.hoverPostIcon}/>
        </span>
      </LWTooltip>
      {postKarmaPreviews.map(post => <PostKarmaWithPreview key={post._id} post={post}/>)}
      { hiddenPostCount ? <span> ({hiddenPostCount} drafted)</span> : null}
    </div>

    <div className={classes.contentSummaryRow}>
      <LWTooltip title="Comment count">
        { user.commentCount || 0 }
      </LWTooltip>
      <MessageIcon className={classes.icon}/>
      {commentKarmaPreviews.map(comment => <CommentKarmaWithPreview key={comment._id} comment={comment}/>)}
      { hiddenCommentCount ? <span> ({hiddenCommentCount} deleted)</span> : null}
      </div>
  </div>;
}

const ContentSummaryRowsComponent = registerComponent('ContentSummaryRows', ContentSummaryRows, {styles});

declare global {
  interface ComponentTypes {
    ContentSummaryRows: typeof ContentSummaryRowsComponent
  }
}
