import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import Reports from '../../lib/collections/reports/collection'
import DialogContent from '@material-ui/core/DialogContent';

export type ReportFormProps = {
  userId: string;
  onClose?: () => void;
  title?: string;
  link: string;
} & ({
  tagId: string;
  tagRevisionId?: string;
  reportType: 'tag';
} | {
  postId: string;
  commentId?: string;
  reportType: 'post';
});

const ReportForm = (props: ReportFormProps) => {
  const { userId, onClose, title, link, reportType } = props;
  const prefilledProps = reportType === 'post' ? {
    userId,
    link,
    postId: props.postId,
    commentId: props.commentId,
  } : {
    userId,
    link,
    tagId: props.tagId,
    tagRevisionId: props.tagRevisionId
  };

  const mutationFragment = reportType === 'post'
    ? getFragment('unclaimedReportsList')
    // TODO
    : getFragment('');

  return (
    <Components.LWDialog
      title={title}
      open={true}
      onClose={onClose}
    >
      <DialogContent>
        <Components.WrappedSmartForm
          collection={Reports}
          mutationFragment={mutationFragment}
          prefilledProps={prefilledProps}
          successCallback={onClose}
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

