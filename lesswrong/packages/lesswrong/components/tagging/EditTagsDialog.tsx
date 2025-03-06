import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import FooterTagList from "@/components/tagging/FooterTagList";
import LWDialog from "@/components/common/LWDialog";
import { DialogTitle, DialogContent } from "@/components/mui-replacement";

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
