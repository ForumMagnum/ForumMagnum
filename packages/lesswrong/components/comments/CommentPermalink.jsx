import React from 'react';
import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  dividerMargins: {
    marginTop: 150,
    marginBottom: 150,
  },
  permalinkLabel: {
    ...theme.typography.body1,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit*2,
    marginLeft: 10,
    [theme.breakpoints.down('md')]: {
      marginTop: theme.spacing.unit*2
    }
  },
  seeInContext: {
    ...theme.typography.body1,
    ...theme.typography.commentStyle,
    textAlign: "right",
    color: theme.palette.lwTertiary.main,
    marginRight: 10
  },
})

const CommentPermalink = (props) => {
  const { documentId, post, document: comment, classes, data: {refetch}, loading, error} = props
  const { Loading, Divider, CommentWithReplies } = Components;

  if (error || (!comment && !loading)) return <div>Comment not found</div>

  if (!documentId) return null

  return <div className={classes.root}>
      <div className={classes.permalinkLabel}>Comment Permalink</div>
      {loading ? <Loading /> : <div>
        <CommentWithReplies key={comment._id} post={post} comment={comment} refetch={refetch}/>
        <div className={classes.seeInContext}><a href={`#${documentId}`}>See in context</a></div>
      </div>}
      <div className={classes.dividerMargins}><Divider /></div>
    </div>
}

registerComponent("CommentPermalink", CommentPermalink,
  withStyles(styles, {name:"CommentPermalink"}),
  [withDocument, {
    collection: Comments,
    queryName: 'commentsPermalinkQuery',
    fragmentName: 'CommentWithReplies',
    ssr: true,
  }]
);
