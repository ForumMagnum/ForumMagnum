import React from 'react';
import classNames from 'classnames';
import { CommentForm } from './CommentForm';
import type { CommentCancelCallback, CommentSuccessCallback } from './CommentsNewForm';
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';

const CommentEditQuery = gql(`
  query CommentEdit($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentEdit
      }
    }
  }
`);

const CommentsEditForm = ({ comment, successCallback, cancelCallback, className, formProps = {}, prefilledProps }: {
  comment: CommentsList | CommentsListWithParentMetadata,
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  className?: string,
  formProps?: Record<string, any>,
  prefilledProps?: AnyBecauseTodo
}) => {
  const { data, loading } = useQuery(CommentEditQuery, {
    variables: { documentId: comment._id },
    fetchPolicy: 'network-only',
  });

  if (loading) {
    return <Loading />;
  }

  const editableComment = data?.comment?.result ?? undefined;
  const handleSuccess = (doc: CommentsList) => {
    void successCallback?.(doc);
  };
  const handleCancel = () => {
    void cancelCallback?.();
  };

  return ( 
    <div className={classNames("comments-edit-form", className)}>
      <CommentForm
        initialData={editableComment}
        prefilledProps={prefilledProps}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        submitLabel={comment.draft ? "Publish" : "Save"}
        disableSubmitDropdown={!comment.draft}
      />
    </div>
  )
}

export default CommentsEditForm;



