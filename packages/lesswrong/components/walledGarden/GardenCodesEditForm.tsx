import React from 'react';
import { gardenForm } from './GardenCodeWidget';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
    ...gardenForm(theme)
  }
})

export const GardenCodesEditForm = ({classes, gardenCodeId, cancelCallback, successCallback}: {
  classes: ClassesType<typeof styles>,
  gardenCodeId: string,
  successCallback?: any,
  cancelCallback?: any,
}) => {
  const { WrappedSmartForm, ContentStyles } = Components
  return <ContentStyles contentType="commentExceptPointerEvents" className={classes.root}>
    <WrappedSmartForm
      layout="elementOnly"
      collectionName="GardenCodes"
      documentId={gardenCodeId}
      successCallback={successCallback}
      cancelCallback={cancelCallback}
      showRemove={false}
      queryFragmentName={'GardenCodeFragmentEdit'}
      mutationFragmentName={'GardenCodeFragmentEdit'}
      submitLabel="Save"
    />
  </ContentStyles>
}

const GardenCodesEditFormComponent = registerComponent('GardenCodesEditForm', GardenCodesEditForm, {styles});

declare global {
  interface ComponentTypes {
    GardenCodesEditForm: typeof GardenCodesEditFormComponent
  }
}
