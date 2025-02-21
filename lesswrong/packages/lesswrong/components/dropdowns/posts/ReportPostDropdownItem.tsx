import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog'

const ReportPostDropdownItem = ({post}: {post: PostsBase}) => {
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
      componentName: "ReportForm",
      componentProps: {
        postId: post._id,
        link: "/posts/" + post._id,
        userId: currentUser._id,
      },
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
};

const ReportPostDropdownItemComponent = registerComponent(
  'ReportPostDropdownItem',
  ReportPostDropdownItem,
);

declare global {
  interface ComponentTypes {
    ReportPostDropdownItem: typeof ReportPostDropdownItemComponent
  }
}
