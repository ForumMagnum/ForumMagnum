import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog'

const ReportCommentDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsMinimumInfo,
}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();

  if (!post || !userCanDo(currentUser, "reports.new")) {
    return null;
  }

  const showReport = () => {
    if (!currentUser) {
      return;
    }

    openDialog({
      name: "ReportForm",
      contents: ({onClose}) => <Components.ReportForm
        onClose={onClose}
        commentId={comment._id}
        postId={comment.postId}
        link={"/posts/" + comment.postId + "/a/" + comment._id}
        userId={currentUser._id}
      />
    });
  }

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title="Report"
      onClick={showReport}
      icon="Report"
    />
  );
}

const ReportCommentDropdownItemComponent = registerComponent('ReportCommentDropdownItem', ReportCommentDropdownItem);

declare global {
  interface ComponentTypes {
    ReportCommentDropdownItem: typeof ReportCommentDropdownItemComponent
  }
}
