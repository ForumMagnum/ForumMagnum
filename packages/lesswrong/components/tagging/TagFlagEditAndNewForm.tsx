import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { TagFlags } from '../../lib/collections/tagFlags/collection';

const TagFlagEditAndNewForm = ({ tagFlagId, onClose, classes }: {
  tagFlagId: string,
  onClose: () => void,
  classes: ClassesType,
}) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      disableEnforceFocus
    >
      <DialogTitle>
        {tagFlagId ? "Edit Tag Flag" : "Create Tag Flag"}
      </DialogTitle>
      <DialogContent>
        <Components.WrappedSmartForm
          collection={TagFlags}
          documentId={tagFlagId}
          queryFragment={getFragment("TagFlagEditFragment")}
          mutationFragment={getFragment("TagFlagFragment")}
          successCallback={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

const TagFlagEditAndNewFormComponent = registerComponent('TagFlagEditAndNewForm', TagFlagEditAndNewForm);

declare global {
  interface ComponentTypes {
    TagFlagEditAndNewForm: typeof TagFlagEditAndNewFormComponent
  }
}
