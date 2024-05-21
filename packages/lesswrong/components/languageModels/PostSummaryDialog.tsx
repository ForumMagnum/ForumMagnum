import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';

const PostSummaryDialog = ({post, onClose}: {
  post: PostsList|SunshinePostsList,
  onClose?: () => void,
}) => {
  const { Loading, LWDialog } = Components;
  const { document: postWithSummary, loading } = useSingle({
    collectionName: "Posts",
    fragmentName: "PostWithGeneratedSummary",
    documentId: post._id,
  });

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
