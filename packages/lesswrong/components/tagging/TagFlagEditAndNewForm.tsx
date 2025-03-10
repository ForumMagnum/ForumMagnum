import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

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
          queryFragmentName={'TagFlagEditFragment'}
          mutationFragmentName={'TagFlagFragment'}
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
