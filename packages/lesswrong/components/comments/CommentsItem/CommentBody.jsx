import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles } from '../../../themes/stylePiping'
import PropTypes from 'prop-types';

const styles = theme => ({
  commentStyling: {
    ...commentBodyStyles(theme)
  }
})
const CommentBody = ({comment, classes}) => {
  const htmlBody = {__html: comment.htmlBody};
  return (
    <div className={classes.commentStyling}>
      {!comment.deleted && <div className="comment-body" dangerouslySetInnerHTML={htmlBody}></div>}
      {comment.deleted && <div className="comment-body"><Components.CommentDeletedMetadata documentId={comment._id}/></div>}
    </div>
  )
}

CommentBody.propTypes = {
  comment: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};


registerComponent('CommentBody', CommentBody, withStyles(styles));
