import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import AddLocationIcon from '@material-ui/icons/AddLocation';
import { useDialog } from '../common/withDialog'
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

const GroupFormLink = ({documentId, isOnline}: {
  documentId?: string
  isOnline?: boolean
}) => {
  const { openDialog } = useDialog();
  const { SectionButton } = Components

  const handleOpenGroupForm = () => {
    openDialog({
      componentName: "GroupFormDialog",
      componentProps: {documentId: documentId, isOnline: isOnline}
    })
  }

  if (documentId) {
    return <SectionButton>
      <span onClick={handleOpenGroupForm}>{preferredHeadingCase('Edit Group')}</span>
    </SectionButton>
  } else {
    return <SectionButton>
      <AddLocationIcon />
      <span onClick={handleOpenGroupForm}>{preferredHeadingCase('New Group')}</span>
    </SectionButton>
  }
}

const GroupFormLinkComponent = registerComponent('GroupFormLink', GroupFormLink);

declare global {
  interface ComponentTypes {
    GroupFormLink: typeof GroupFormLinkComponent
  }
}

