import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';

const CommentsEditForm = ({ comment, successCallback, cancelCallback, className, formProps = {}, prefilledProps }: {
  comment: CommentsList | CommentsListWithParentMetadata,
  successCallback?: any,
  cancelCallback?: any,
  className?: string,
  formProps?: Record<string, any>,
  prefilledProps?: AnyBecauseTodo
}) => {
  return (
    <div className={classNames("comments-edit-form", className)}>
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
        formProps={formProps}
        prefilledProps={prefilledProps}
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

