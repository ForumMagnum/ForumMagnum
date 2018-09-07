import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles } from '../../../themes/stylePiping'

const styles = theme => ({
  commentStyling: {
    marginTop: ".5em",
    ...commentBodyStyles(theme)
  }
})
const CommentBody = ({comment, classes}) => {
  const htmlBody = {__html: comment.htmlBody};
  return (
    <div className={classes.commentStyling}>
      {htmlBody && !comment.deleted && <div className="comment-body" dangerouslySetInnerHTML={htmlBody}></div>}
      {comment.deleted && <div className="comment-body"><Components.CommentDeletedMetadata documentId={comment._id}/></div>}
    </div>
  )
}

registerComponent('CommentBody', CommentBody, withStyles(styles));
