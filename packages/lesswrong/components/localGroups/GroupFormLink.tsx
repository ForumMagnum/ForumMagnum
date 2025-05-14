import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import AddLocationIcon from '@/lib/vendor/@material-ui/icons/src/AddLocation';
import { useDialog } from '../common/withDialog'
import { preferredHeadingCase } from '../../themes/forumTheme';
import { Link } from '../../lib/reactRouterWrapper';
import GroupFormDialog from "./GroupFormDialog";
import SectionButton from "../common/SectionButton";

const GroupFormLink = ({documentId, isOnline}: {
  documentId?: string
  isOnline?: boolean
}) => {
  const { openDialog } = useDialog();
  const handleOpenGroupForm = () => {
    openDialog({
      name: "GroupFormDialog",
      contents: ({onClose}) => <GroupFormDialog
        onClose={onClose}
        documentId={documentId}
        isOnline={isOnline}
      />
    })
  }

  if (documentId) {
    return <SectionButton>
      <a onClick={handleOpenGroupForm} href="#">{preferredHeadingCase('Edit Group')}</a>
    </SectionButton>
  } else {
    return <SectionButton>
      <AddLocationIcon />
      <a onClick={handleOpenGroupForm} href="#">{preferredHeadingCase('New Group')}</a>
    </SectionButton>
  }
}

export default registerComponent('GroupFormLink', GroupFormLink);


