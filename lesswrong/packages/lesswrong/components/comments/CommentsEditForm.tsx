import React from 'react';
import classNames from 'classnames';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";

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
      <WrappedSmartForm
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

export default CommentsEditFormComponent;

