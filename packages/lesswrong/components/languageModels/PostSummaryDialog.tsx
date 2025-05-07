import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostWithGeneratedSummaryQuery = gql(`
  query PostSummaryDialog($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostWithGeneratedSummary
      }
    }
  }
`);

const PostSummaryDialog = ({post, onClose}: {
  post: PostsList|SunshinePostsList,
  onClose?: () => void,
}) => {
  const { Loading, LWDialog } = Components;
  const { loading, data } = useQuery(PostWithGeneratedSummaryQuery, {
    variables: { documentId: post._id },
  });
  const postWithSummary = data?.post?.result;

  return <LWDialog open={true} onClose={onClose}>
    <DialogTitle>{post.title}</DialogTitle>
    <DialogContent>
      {loading && <Loading/>}
      {postWithSummary && postWithSummary.languageModelSummary}
    </DialogContent>
  </LWDialog>
}

const PostSummaryDialogComponent = registerComponent(
  'PostSummaryDialog',
  PostSummaryDialog,
);

declare global {
  interface ComponentTypes {
    PostSummaryDialog: typeof PostSummaryDialogComponent
  }
}
