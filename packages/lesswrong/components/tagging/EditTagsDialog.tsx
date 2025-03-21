import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
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
