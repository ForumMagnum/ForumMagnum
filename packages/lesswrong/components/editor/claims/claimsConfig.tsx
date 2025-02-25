import { OpenDialogContextType } from '@/components/common/withDialog';
import { Components } from '@/lib/vulcan-lib/components';
import React from 'react';
import { CkEditorPortalContextType } from '../CKEditorPortalProvider';
import type { ClaimsPluginConfiguration, CreateClaimDialogProps } from './claimsConfigType';


export const claimsConfig = (portalContext: CkEditorPortalContextType|null, openDialog: OpenDialogContextType['openDialog']): ClaimsPluginConfiguration => ({
  openNewClaimDialog: (props: CreateClaimDialogProps) => {
    openDialog({
      componentName: "CreateClaimDialog",
      componentProps: props,
    });
  },
  renderClaimPreviewInto: (element: HTMLElement, claimId: string) => {
    if (portalContext) {
      portalContext.createPortal(element, <Components.ElicitBlock questionId={claimId}/>);
    }
  },
});
