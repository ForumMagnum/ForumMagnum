import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const ReportForm = ({ userId, postId, commentId, reportedUserId, onClose, onSubmit, title, link }: {
  userId: string,
  postId?: string,
  commentId?: string,
  reportedUserId?: string,
  onClose?: () => void,
  onSubmit?: () => void,
  title?: string,
  link: string,
}) => {

  const handleSubmit = () => {
    onSubmit && onSubmit()
    onClose && onClose()
  }
  
  return (
    <Components.LWDialog
      title={title}
      open={true}
      onClose={onClose}
    >
      <DialogContent>
        <Components.WrappedSmartForm
          collectionName="Reports"
          mutationFragmentName={'UnclaimedReportsList'}
          prefilledProps={{
            userId: userId,
            postId: postId,
            reportedUserId: reportedUserId,
            commentId: commentId,
            link: link
          }}
          successCallback={handleSubmit}
        />
      </DialogContent>
    </Components.LWDialog>
  )
}

const ReportFormComponent = registerComponent('ReportForm', ReportForm);

declare global {
  interface ComponentTypes {
    ReportForm: typeof ReportFormComponent
  }
}

