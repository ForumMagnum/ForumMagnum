import React from 'react';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { gardenForm } from './GardenCodeWidget';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...gardenForm(theme)
  }
})

export const GardenCodesEditForm = ({classes, gardenCodeId, cancelCallback, successCallback}: {
  classes: ClassesType,
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
      queryFragment={getFragment('GardenCodeFragmentEdit')}
      mutationFragment={getFragment('GardenCodeFragmentEdit')}
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
