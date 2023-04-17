import React, { useCallback, useContext } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { Comments } from "../../lib/collections/comments";
import { CommentPoolContext } from './CommentPool';
import classNames from 'classnames';

const CommentsEditForm = ({ comment, successCallback, cancelCallback, className, formProps = {} }: {
  comment: CommentsList,
  successCallback?: ()=>void,
  cancelCallback?: ()=>void,
  className?: string,
  formProps?: Record<string, any>
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
    <div className={classNames("comments-edit-form", className)}>
      <Components.WrappedSmartForm
        layout="elementOnly"
        collectionName="Comments"
        documentId={comment._id}
        successCallback={wrappedSuccessCallback}
        cancelCallback={cancelCallback}
        showRemove={false}
        queryFragment={getFragment('CommentEdit')}
        mutationFragment={getFragment('CommentsList')}
        submitLabel="Save"
        formProps={formProps}
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

