import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useSingle } from '../../lib/crud/withSingle';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import MenuItem from '@material-ui/core/MenuItem';

const styles = (theme: ThemeType) => ({
})

const PostSummaryAction = ({post, classes}: {
  post: PostsList,
  classes: ClassesType,
}) => {
  const { openDialog } = useDialog();
  
  const showPostSummary = () => {
    openDialog({
      componentName: "PostSummaryDialog",
      componentProps: { post },
    });
  }
  
  return <MenuItem onClick={showPostSummary}>
    Summarize
  </MenuItem>
}

const PostSummaryDialog = ({post, onClose, classes}: {
  post: PostsList,
  onClose?: ()=>void,
  classes: ClassesType,
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

const PostSummaryActionComponent = registerComponent('PostSummaryAction', PostSummaryAction, {styles});
const PostSummaryDialogComponent = registerComponent('PostSummaryDialog', PostSummaryDialog, {styles});

declare global {
  interface ComponentTypes {
    PostSummaryAction: typeof PostSummaryActionComponent
    PostSummaryDialog: typeof PostSummaryDialogComponent
  }
}
