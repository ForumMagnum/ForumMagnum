import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("NewLensDialog", (theme: ThemeType) => ({
  dialog: {
    padding: 20,
    minHeight: 400,
    minWidth: 400,
  }
}));

export const NewLensDialog = ({ onClose }: {
  onClose?: () => void,
}) => {
  const { LWDialog, WrappedSmartForm } = Components;
  
  const classes = useStyles(styles);
  
  return <LWDialog open={true} onClose={onClose} dialogClasses={{ paper: classes.dialog }}>
    <WrappedSmartForm
      collectionName='MultiDocuments'
      queryFragmentName='MultiDocumentMinimumInfo'
      mutationFragmentName='MultiDocumentMinimumInfo'
      successCallback={() => onClose?.()}
      cancelCallback={() => onClose?.()}
      formProps={{
        newLensForm: true,
      }}
      removeFields={['contents']}
    />
  </LWDialog>;
}

const NewLensDialogComponent = registerComponent('NewLensDialog', NewLensDialog);

declare global {
  interface ComponentTypes {
    NewLensDialog: typeof NewLensDialogComponent
  }
}
