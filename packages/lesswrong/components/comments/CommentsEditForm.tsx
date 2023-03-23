import React, { useCallback, useContext } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { Comments } from "../../lib/collections/comments";
import { CommentPoolContext } from './CommentPool';

const CommentsEditForm = ({ comment, successCallback, cancelCallback }: {
  comment: CommentsList,
  successCallback?: ()=>void,
  cancelCallback?: ()=>void,
}) => {
  const commentPoolContext = useContext(CommentPoolContext);
  const wrappedSuccessCallback = useCallback(() => {
    if (successCallback) {
      successCallback();
    }
    if (commentPoolContext) {
      void commentPoolContext.invalidateComment(comment._id);
    }
  }, [commentPoolContext, successCallback, comment._id]);

  return (
    <div className="comments-edit-form">
      <Components.WrappedSmartForm
        layout="elementOnly"
        collection={Comments}
        documentId={comment._id}
        successCallback={wrappedSuccessCallback}
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

