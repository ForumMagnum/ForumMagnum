import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { DialogContent } from "@/components/widgets/DialogContent";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const EditTagsDialog = ({post, onClose }: {
  post: PostsList|SunshinePostsList,
  onClose?: () => void
}) => {
  const { FooterTagList, LWDialog } = Components
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
