import React from 'react';
import classNames from 'classnames';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentForm } from './CommentForm';
import { useSingle } from '@/lib/crud/withSingle';
import Loading from "../vulcan-core/Loading";

const CommentsEditForm = ({
  comment,
  successCallback,
  cancelCallback,
  prefilledProps,
  hideControls,
  className,
}: {
  comment: CommentsList | CommentsListWithParentMetadata,
  successCallback?: any,
  cancelCallback?: any,
  prefilledProps?: AnyBecauseTodo
  hideControls?: boolean,
  className?: string,
}) => {
  const { document: editableComment, loading } = useSingle({
    collectionName: 'Comments',
    fragmentName: 'CommentEdit',
    documentId: comment._id,
    fetchPolicy: 'network-only',
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
        submitLabel={comment.draft ? "Publish" : "Save"}
        disableSubmitDropdown={!comment.draft}
        hideControls={hideControls}
      />
    </div>
  )
}

export default registerComponent('CommentsEditForm', CommentsEditForm);
