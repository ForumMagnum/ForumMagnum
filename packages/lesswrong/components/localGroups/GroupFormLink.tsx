import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import AddLocationIcon from '@/lib/vendor/@material-ui/icons/src/AddLocation';
import { useDialog } from '../common/withDialog'
import { preferredHeadingCase } from '../../themes/forumTheme';
import { Link } from '../../lib/reactRouterWrapper';


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
      <a onClick={handleOpenGroupForm} href="#">{preferredHeadingCase('Edit Group')}</a>
    </SectionButton>
  } else {
    return <SectionButton>
      <AddLocationIcon />
      <a onClick={handleOpenGroupForm} href="#">{preferredHeadingCase('New Group')}</a>
    </SectionButton>
  }
}

const GroupFormLinkComponent = registerComponent('GroupFormLink', GroupFormLink);

declare global {
  interface ComponentTypes {
    GroupFormLink: typeof GroupFormLinkComponent
  }
}
