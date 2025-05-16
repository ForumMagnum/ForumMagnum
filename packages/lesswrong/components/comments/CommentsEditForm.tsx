import React from 'react';
import classNames from 'classnames';
import type { CommentsList, CommentsListWithParentMetadata } from '@/lib/generated/gql-codegen/graphql';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentForm } from './CommentForm';
import Loading from "../vulcan-core/Loading";
import { useQuery } from '@apollo/client';
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
  successCallback?: any,
  cancelCallback?: any,
  className?: string,
  formProps?: Record<string, any>,
  prefilledProps?: AnyBecauseTodo
}) => {
  const { data: editableComment, loading } = useQuery(CommentEditQuery, {
    variables: { documentId: comment._id },
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
        submitLabel="Save"
      />
    </div>
  )
}

export default registerComponent('CommentsEditForm', CommentsEditForm);



