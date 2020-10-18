import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const EditTagsDialog = ({post, onClose }: {
  post: PostsList,
  onClose: ()=>void
}) => {
  const { FooterTagList } = Components
  return <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm" disableEnforceFocus>
    <AnalyticsContext pageSectionContext="editTagsDialog">
      <DialogTitle>{post.title}</DialogTitle>
      <DialogContent>
        <FooterTagList post={post}/>
      </DialogContent>
    </AnalyticsContext>
  </Dialog>
}

const EditTagsDialogComponent = registerComponent('EditTagsDialog', EditTagsDialog);

declare global {
  interface ComponentTypes {
    EditTagsDialog: typeof EditTagsDialogComponent
  }
}
