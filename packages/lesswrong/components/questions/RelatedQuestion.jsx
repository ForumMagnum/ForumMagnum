import { Components, registerComponent, withMulti } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import withErrorBoundary from '../common/withErrorBoundary';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'
import { unflattenComments } from "../../lib/modules/utils/unflatten";

const styles = theme => ({
  root: {
    border: "solid 1px rgba(0,0,0,.2)"
  },
  comments: {
    border: "solid 1px rgba(0,0,0,.2)",
    marginTop: 3,
    marginLeft: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit,
    marginRight: -1
  }
})

const RelatedQuestion = ({ post, index, currentUser, classes, showBottomBorder, results, totalCount, nestingLevel=1 }) => {

  const { PostsItem2, CommentsList } = Components
  const nestedComments = unflattenComments(results);
  const lastVisitedAt = post.lastVisitedAt
  const showComments = results?.length > 0
  const passedPostsItemProps = { post, index }

  return (
    <div className={classes.root}>
      <PostsItem2 
        showQuestionTag={false}
        showPostedAt={false}
        showBottomBorder={false}
        { ...passedPostsItemProps}
      />
      {showComments && <div className={classes.comments}>
        <CommentsList
          totalComments={totalCount}
          comments={nestedComments}
          highlightDate={lastVisitedAt}
          post={post}
          defaultNestingLevel={nestingLevel+2}
          postPage
          startThreadTruncated
          condensed
        />
      </div>}
    </div>
  )
}

const multiOptions = {
  collection: Comments,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'CommentsList',
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
  ssr: true,
  fetchPolicy: 'cache-and-network',
  limit: 12,
}

registerComponent('RelatedQuestion', RelatedQuestion, withUser, [withMulti, multiOptions], withErrorBoundary, withStyles(styles, {name:"RelatedQuestion"}));
