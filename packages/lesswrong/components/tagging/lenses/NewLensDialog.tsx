import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { DialogContent } from "@/components/widgets/DialogContent";
import { DialogContentText } from "@/components/widgets/DialogContentText";
import { DialogTitle } from "@/components/widgets/DialogTitle";

const styles = defineStyles("NewLensDialog", (theme: ThemeType) => ({
  dialog: {
    padding: 10,
    '& .vulcan-form': {
      marginTop: 10,
      padding: '0px 10px',
      background: theme.palette.grey[100],
      borderTopLeftRadius: theme.borderRadius.small,
      borderTopRightRadius: theme.borderRadius.small,
    },
    '& .form-input': {
      marginTop: 8,
      marginBottom: 8,
    },
    '& .input-title, & .input-tabTitle, & .input-tabSubtitle': {
      display: 'inline-block',
      width: 120,
      marginRight: 20,
      '& .MuiTextField-textField': {
        width: '100%',
      },
    },
    '& .form-submit': {
      paddingBottom: 8,
      display: 'flex',
      justifyContent: 'end',
    },
  },
  dialogContent: {
    padding: '0px 16px 16px',
  },
  dialogTitle: {
    padding: '16px 16px 10px',
  },
}));

export const NewLensDialog = ({ tag, refetchTag, updateSelectedLens, onClose }: {
  tag: TagPageWithRevisionFragment | TagPageFragment,
  refetchTag: () => Promise<void>,
  updateSelectedLens: (lensId: string) => void,
  onClose?: () => void,
}) => {
  const { LWDialog, WrappedSmartForm } = Components;
  
  const classes = useStyles(styles);

  const wrappedSuccessCallback = async (lens: MultiDocumentMinimumInfo) => {
    await refetchTag();
    updateSelectedLens(lens._id);
    onClose?.();
  };

  const prefilledProps = {
    parentDocumentId: tag._id,
    collectionName: 'Tags',
    fieldName: 'description',
  };
  
  return <LWDialog open={true} onClose={onClose} dialogClasses={{ paper: classes.dialog }}>
    <DialogTitle className={classes.dialogTitle}>New Lens</DialogTitle>
    <DialogContent className={classes.dialogContent}>
      <DialogContentText>
        Creating a new lens is appropriate when you want to present an alternative view on the content, such as a more or less technical explanation.
        <p /><p />
        The title of the lens is displayed at the top of the content, and the tab title and (optional) subtitle are displayed in the tab bar.
      </DialogContentText>
      <WrappedSmartForm
        collectionName='MultiDocuments'
        queryFragmentName='MultiDocumentMinimumInfo'
        mutationFragmentName='MultiDocumentMinimumInfo'
        successCallback={wrappedSuccessCallback}
        cancelCallback={() => onClose?.()}
        formProps={{
          lensForm: true,
          editorHintText: 'New lens content goes here!'
        }}
        prefilledProps={prefilledProps}
      />
    </DialogContent>
  </LWDialog>;
}

const NewLensDialogComponent = registerComponent('NewLensDialog', NewLensDialog);

declare global {
  interface ComponentTypes {
    NewLensDialog: typeof NewLensDialogComponent
  }
}
