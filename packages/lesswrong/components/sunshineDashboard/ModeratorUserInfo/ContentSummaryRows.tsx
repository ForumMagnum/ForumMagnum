import classNames from 'classnames';
import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import * as _ from 'underscore'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'

const styles = (theme: ThemeType) => ({
  contentSummaryRow: {
    display: "flex",
    flexWrap: "wrap",
  },
  displayTitles: {
    display: "block",
    marginTop: 8,
    overflow: "hidden"
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
  average: {
    color: theme.palette.grey[500],
    fontSize: ".9rem",
    marginLeft: 7
  }
});

export const ContentSummaryRows = ({classes, comments, posts, user, loading}: {
  classes: ClassesType<typeof styles>,
  comments: CommentsListWithParentMetadata[],
  posts: SunshinePostsList[],
  user: SunshineUsersList,
  loading: boolean
}) => {
  const { LWTooltip, PostKarmaWithPreview, CommentKarmaWithPreview, Loading, Row } = Components 
  const [contentSort, setContentSort] = useState<'baseScore' | 'postedAt'>("postedAt")
  const [contentDisplay, setContentDisplay] = useState<'titles' | 'karma'>("karma")

  const commentKarmaPreviews = comments ? _.sortBy(comments, contentSort) : []
  const postKarmaPreviews = posts ? _.sortBy(posts, contentSort) : []
  
  const hiddenPostCount = user.maxPostCount - user.postCount
  const hiddenCommentCount = user.maxCommentCount - user.commentCount

  const getAverageBaseScore = (list: Array<SunshinePostsList|CommentsListWithParentMetadata>) => { 
    const average = list.reduce((sum, item) => item.baseScore + sum, 0) / list.length
    return average.toFixed(1) 
  }

  const averagePostKarma = posts?.length ? 
    <LWTooltip title="average karma">
      <span className={classes.average}>
        {getAverageBaseScore(posts)}
      </span>
    </LWTooltip>
  : null
  const averageCommentKarma = comments?.length ? 
    <LWTooltip title="average karma">
      <span className={classes.average}>
        {getAverageBaseScore(comments)}
      </span>
    </LWTooltip>
  : null

  return <div>
    <Row>
      <div>
        Sort by:{" "}
        <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "baseScore"})} onClick={() => setContentSort("baseScore")}>
          karma
        </span>
        <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentSort === "postedAt"})} onClick={() => setContentSort("postedAt")}>
          postedAt
        </span>
      </div>
      <div>
        Display as{" "}
        <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentDisplay === "karma"})} onClick={() => setContentDisplay("karma")}>
          karma
        </span>
        <span className={classNames(classes.sortButton, {[classes.sortSelected]: contentDisplay === "titles"})} onClick={() => setContentDisplay("titles")}>
          titles
        </span>
      </div>
    </Row>

    {loading && <Loading/>}

    <div className={classNames(classes.contentSummaryRow, {[classes.displayTitles]:contentDisplay === "titles"})}>
      <LWTooltip title="Post count">
        <span>
          { user.postCount || 0 }
          <DescriptionIcon className={classes.hoverPostIcon}/>
        </span>
      </LWTooltip>
      {postKarmaPreviews.map(post => <PostKarmaWithPreview key={post._id} post={post} reviewedAt={user.reviewedAt} displayTitle={contentDisplay === "titles"}/>)}
      { hiddenPostCount ? <span> ({hiddenPostCount} drafted or rejected)</span> : null}
      {averagePostKarma}
    </div>

    <div className={classNames(classes.contentSummaryRow, {[classes.displayTitles]:contentDisplay === "titles"})}>
      <LWTooltip title="Comment count">
        <span>
          { user.commentCount || 0 }
          <MessageIcon className={classes.icon}/>
        </span>
      </LWTooltip>
      {commentKarmaPreviews.map(comment => <CommentKarmaWithPreview key={comment._id} reviewedAt={user.reviewedAt} comment={comment} displayTitle={contentDisplay === "titles"}/>)}
      { hiddenCommentCount ? <span> ({hiddenCommentCount} deleted or rejected)</span> : null}
      {averageCommentKarma}
      </div>
  </div>;
}

const ContentSummaryRowsComponent = registerComponent('ContentSummaryRows', ContentSummaryRows, {styles});

declare global {
  interface ComponentTypes {
    ContentSummaryRows: typeof ContentSummaryRowsComponent
  }
}
