import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import { Comments } from "../../lib/collections/comments";

const CommentsEditForm = ({ comment, successCallback, cancelCallback }: {
  comment: any,
  successCallback?: any,
  cancelCallback?: any,
}) => {
  return (
    <div className="comments-edit-form">
      <Components.WrappedSmartForm
        layout="elementOnly"
        collectionName="Comments"
        documentId={comment._id}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        showRemove={false}
        queryFragment={getFragment('CommentEdit')}
        mutationFragment={getFragment('CommentsList')}
        submitLabel="Save"
      />
    </div>
  )
}

const CommentsEditFormComponent = registerComponent('CommentsEditForm', CommentsEditForm);

declare global {
  interface ComponentTypes {
    CommentsEditForm: typeof CommentsEditFormComponent,
  }
}

