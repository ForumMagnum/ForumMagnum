import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from "../../lib/collections/comments";

const CommentsEditForm = (props) => {
  return (
    <div className="comments-edit-form">
      <Components.WrappedSmartForm
        layout="elementOnly"
        collection={Comments}
        documentId={props.comment._id}
        successCallback={props.successCallback}
        cancelCallback={props.cancelCallback}
        showRemove={false}
        queryFragment={getFragment('CommentEdit')}
        mutationFragment={getFragment('CommentsList')}
        submitLabel="Save"
      />
    </div>
  )
}

CommentsEditForm.propTypes = {
  comment: PropTypes.object.isRequired,
  successCallback: PropTypes.func,
  cancelCallback: PropTypes.func
};

registerComponent('CommentsEditForm', CommentsEditForm, withMessages);
