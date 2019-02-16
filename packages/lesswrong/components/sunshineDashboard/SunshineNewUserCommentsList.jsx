import { Components, registerComponent, withMulti } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles'
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from 'react-router'

const styles = theme => ({
  comment: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    ...commentBodyStyles(theme),
    fontSize: "1em",
    color: "rgba(0,0,0,.7)"
  }
})

const SunshineNewUserCommentsList = ({loading, results, classes}) => {
  const { FormatDate, MetaInfo, Loading } = Components

  if (!results && loading) return <Loading />
  if (!results) return null 

  return (
    <div>
      {loading && <Loading />}
      {results.map(comment=><div className={classes.comment} key={comment._id}>
        <MetaInfo>
          <Link to={`/posts/${comment.postId}`}>
            Posted on <FormatDate date={comment.postedAt}/> {comment.status}
          </Link>
        </MetaInfo>
        <div><MetaInfo>{comment.deleted && `[Comment deleted${comment.deletedReason ? ` because "${comment.deletedReason}"` : ""}]`}</MetaInfo></div>
        <div dangerouslySetInnerHTML={{__html: (comment.contents && comment.contents.html) || ""}} />
      </div>)}
    </div>
  )
}

const withMultiOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
}

registerComponent( 'SunshineNewUserCommentsList', SunshineNewUserCommentsList, [withMulti, withMultiOptions], withStyles(styles, {name:"SunshineNewUserCommentsList"}))
