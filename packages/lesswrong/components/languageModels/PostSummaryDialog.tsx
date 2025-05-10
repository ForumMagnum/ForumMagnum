import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { DialogContent } from "@/components/widgets/DialogContent";
import { Loading } from "../vulcan-core/Loading";
import { LWDialog } from "../common/LWDialog";

const PostSummaryDialogInner = ({post, onClose}: {
  post: PostsList|SunshinePostsList,
  onClose?: () => void,
}) => {
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

export const PostSummaryDialog = registerComponent(
  'PostSummaryDialog',
  PostSummaryDialogInner,
);


