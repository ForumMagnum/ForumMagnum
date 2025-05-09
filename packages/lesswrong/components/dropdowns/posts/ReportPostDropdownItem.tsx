import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog'
import { ReportForm } from "../../sunshineDashboard/ReportForm";
import { DropdownItem } from "../DropdownItem";

const ReportPostDropdownItemInner = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog();

  if (!userCanDo(currentUser, "reports.new")) {
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
        postId={post._id}
        link={"/posts/" + post._id}
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
};

export const ReportPostDropdownItem = registerComponent(
  'ReportPostDropdownItem',
  ReportPostDropdownItemInner,
);


