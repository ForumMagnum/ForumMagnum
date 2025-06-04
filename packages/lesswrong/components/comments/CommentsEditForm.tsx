import React from 'react';
import classNames from 'classnames';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentForm } from './CommentForm';
import { useSingle } from '@/lib/crud/withSingle';
import Loading from "../vulcan-core/Loading";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("CommentsEditForm", (theme) => ({
  root: {
    position: "relative",
    paddingBottom: 12,
    "& .form-submit": {
      textAlign: "right",
      marginRight: 10,
    },
  },
}));

const CommentsEditForm = ({ comment, successCallback, cancelCallback, className, formProps = {}, prefilledProps }: {
  comment: CommentsList | CommentsListWithParentMetadata,
  successCallback?: any,
  cancelCallback?: any,
  className?: string,
  formProps?: Record<string, any>,
  prefilledProps?: AnyBecauseTodo
}) => {
  const classes = useStyles(styles);
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
    <div className={classNames(classes.root, className)}>
      <CommentForm
        initialData={editableComment}
        prefilledProps={prefilledProps}
        onSuccess={successCallback}
        onCancel={cancelCallback}
        submitLabel={comment.draft ? "Publish" : "Save"}
        disableSubmitDropdown={!comment.draft}
      />
    </div>
  )
}

export default registerComponent('CommentsEditForm', CommentsEditForm);



