import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { DialogTitle } from "@/components/widgets/DialogTitle";
import { DialogContent } from "@/components/widgets/DialogContent";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { FooterTagList } from "./FooterTagList";
import { LWDialog } from "../common/LWDialog";

const EditTagsDialogInner = ({post, onClose }: {
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

export const EditTagsDialog = registerComponent('EditTagsDialog', EditTagsDialogInner);


