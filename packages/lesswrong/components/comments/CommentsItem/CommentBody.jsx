import { Components, getRawComponent } from 'meteor/vulcan:core';
import React from 'react';
import { commentBodyStyles } from '../../../themes/stylePiping'
import PropTypes from 'prop-types';
import defineComponent from '../../../lib/defineComponent';

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


export default defineComponent({
  name: 'CommentBody',
  component: CommentBody,
  styles: styles,
});
