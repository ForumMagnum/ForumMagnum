import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog'
import ReportForm from "../../sunshineDashboard/ReportForm";
import DropdownItem from "../DropdownItem";

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
      contents: ({onClose}) => <ReportForm
        onClose={onClose}
        commentId={comment._id}
        postId={comment.postId ?? undefined}
        link={"/posts/" + comment.postId + "/a/" + comment._id}
        userId={currentUser._id}
      />
    });
  }
  return (
    <DropdownItem
      title="Report"
      onClick={showReport}
      icon="Report"
    />
  );
}

export default registerComponent('ReportCommentDropdownItem', ReportCommentDropdownItem);


