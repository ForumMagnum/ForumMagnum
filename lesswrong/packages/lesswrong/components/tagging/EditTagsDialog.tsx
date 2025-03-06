import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import FooterTagList from "@/components/tagging/FooterTagList";
import LWDialog from "@/components/common/LWDialog";

const EditTagsDialog = ({post, onClose }: {
  post: PostsList|SunshinePostsList,
  onClose?: () => void
}) => {
  return <LWDialog open={true} onClose={onClose} fullWidth maxWidth="sm">
    <AnalyticsContext pageSectionContext="editTagsDialog">
      <DialogTitle>{post.title}</DialogTitle>
      <DialogContent>
        <FooterTagList post={post}/>
      </DialogContent>
    </AnalyticsContext>
  </LWDialog>
}

const EditTagsDialogComponent = registerComponent('EditTagsDialog', EditTagsDialog);

declare global {
  interface ComponentTypes {
    EditTagsDialog: typeof EditTagsDialogComponent
  }
}

export default EditTagsDialogComponent;
