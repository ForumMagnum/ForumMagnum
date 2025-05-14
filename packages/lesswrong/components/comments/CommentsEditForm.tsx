import React from 'react';
import classNames from 'classnames';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentForm } from './CommentForm';
import { useSingle } from '@/lib/crud/withSingle';
import Loading from "../vulcan-core/Loading";

const CommentsEditForm = ({ comment, successCallback, cancelCallback, className, formProps = {}, prefilledProps }: {
  comment: CommentsList | CommentsListWithParentMetadata,
  successCallback?: any,
  cancelCallback?: any,
  className?: string,
  formProps?: Record<string, any>,
  prefilledProps?: AnyBecauseTodo
}) => {
  const { document: editableComment, loading } = useSingle({
    collectionName: 'Comments',
    fragmentName: 'CommentEdit',
    documentId: comment._id,
  });

  if (loading) {
    return <Loading />;
  }

  return ( 
    <div className={classNames("comments-edit-form", className)}>
      <CommentForm
        initialData={editableComment}
        prefilledProps={prefilledProps}
        onSuccess={successCallback}
        onCancel={cancelCallback}
        submitLabel="Save"
      />
    </div>
  )
}

export default registerComponent('CommentsEditForm', CommentsEditForm);



