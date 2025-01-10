import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';

const TagFlagEditAndNewForm = ({ tagFlagId, onClose }: {
  tagFlagId?: string,
  onClose?: () => void,
}) => {
  const { LWDialog } = Components;
  return (
    <LWDialog
      open={true}
      onClose={onClose}
    >
      <DialogTitle>
        {tagFlagId ?
          `Edit ${taggingNameCapitalSetting.get()} Flag` :
          `Create ${taggingNameCapitalSetting.get()} Flag`}
      </DialogTitle>
      <DialogContent>
        <Components.WrappedSmartForm
          collectionName="TagFlags"
          documentId={tagFlagId}
          queryFragment={getFragment("TagFlagEditFragment")}
          mutationFragment={getFragment("TagFlagFragment")}
          successCallback={onClose}
        />
      </DialogContent>
    </LWDialog>
  )
}

const TagFlagEditAndNewFormComponent = registerComponent('TagFlagEditAndNewForm', TagFlagEditAndNewForm);

declare global {
  interface ComponentTypes {
    TagFlagEditAndNewForm: typeof TagFlagEditAndNewFormComponent
  }
}
