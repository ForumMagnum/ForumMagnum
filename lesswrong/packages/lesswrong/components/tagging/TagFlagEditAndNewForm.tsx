import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";
import LWDialog from "@/components/common/LWDialog";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";

const TagFlagEditAndNewForm = ({ tagFlagId, onClose }: {
  tagFlagId?: string,
  onClose?: () => void,
}) => {
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
        <WrappedSmartForm
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

export default TagFlagEditAndNewFormComponent;
