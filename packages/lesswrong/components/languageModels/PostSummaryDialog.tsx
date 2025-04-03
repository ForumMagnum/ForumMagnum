import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';

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
