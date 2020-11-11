import React from 'react';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';

const styles = theme => ({
  root: {
    width: 350,
    border: "solid 1px rgba(0,0,0,.5)",
    padding: 16,
    borderRadius: 5,
  }
})

export const GardenCodesEditForm = ({classes, gardenCodeId, cancelCallback, successCallback}:{
  classes:ClassesType,
  gardenCodeId: string,
  successCallback?: any,
  cancelCallback?: any,
}) => {
  const { WrappedSmartForm } = Components
  return <div className={classes.root}>
    <WrappedSmartForm
      layout="elementOnly"
      collection={GardenCodes}
      documentId={gardenCodeId}
      successCallback={successCallback}
      cancelCallback={cancelCallback}
      showRemove={false}
      queryFragment={getFragment('GardenCodeFragment')}
      mutationFragment={getFragment('GardenCodeFragment')}
      submitLabel="Save"
    />
  </div>
}

const GardenCodesEditFormComponent = registerComponent('GardenCodesEditForm', GardenCodesEditForm, {styles});

declare global {
  interface ComponentTypes {
    GardenCodesEditForm: typeof GardenCodesEditFormComponent
  }
}
