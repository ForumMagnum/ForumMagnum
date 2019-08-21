import { Components, registerComponent, withMulti } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles'
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper.js'

const styles = theme => ({
  comment: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    color: "rgba(0,0,0,.7)"
  },
  commentStyle: {
    ...commentBodyStyles(theme),
  }
})

const SunshineNewUserCommentsList = ({loading, results, classes, truncated}) => {
  const { FormatDate, MetaInfo, Loading } = Components

  if (!results && loading && !truncated) return <Loading />
  if (!results) return null 

  return (
    <div>
      {loading && !truncated && <Loading />}
      {results.map(comment=><div className={classes.comment} key={comment._id}>
        <MetaInfo>
          <Link to={`/posts/${comment.postId}`}>
            Comment made <FormatDate date={comment.postedAt}/> {comment.status}
          </Link>
        </MetaInfo>
        {!truncated && <div><MetaInfo>{comment.deleted && `[Comment deleted${comment.deletedReason ? ` because "${comment.deletedReason}"` : ""}]`}</MetaInfo></div>}
        <div className={classes.commentStyle} dangerouslySetInnerHTML={{__html: (comment.contents && comment.contents.html) || ""}} />
      </div>)}
    </div>
  )
}

const withMultiOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
  enableCache: true,
  fetchPolicy: 'cache-and-network',
}

registerComponent( 'SunshineNewUserCommentsList', SunshineNewUserCommentsList, [withMulti, withMultiOptions], withStyles(styles, {name:"SunshineNewUserCommentsList"}))
