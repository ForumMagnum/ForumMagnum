import { OpenDialogContextType } from '@/components/common/withDialog';
import React from 'react';
import { CkEditorPortalContextType } from '../CKEditorPortalProvider';
import type { ClaimsPluginConfiguration, CreateClaimDialogProps } from './claimsConfigType';
import CreateClaimDialog from "./CreateClaimDialog";
import ElicitBlock from "../../contents/ElicitBlock";

export const claimsConfig = (portalContext: CkEditorPortalContextType|null, openDialog: OpenDialogContextType['openDialog']): ClaimsPluginConfiguration => ({
  openNewClaimDialog: (props: CreateClaimDialogProps) => {
    openDialog({
      name: "CreateClaimDialog",
      contents: ({onClose}) => <CreateClaimDialog
        onClose={onClose}
        {...props}
      />
    });
  },
  renderClaimPreviewInto: (element: HTMLElement, claimId: string) => {
    if (portalContext) {
      portalContext.createPortal(element, <ElicitBlock questionId={claimId}/>);
    }
  },
});
