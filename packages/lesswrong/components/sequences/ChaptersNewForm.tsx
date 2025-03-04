import React from 'react';
import { styles } from './CollectionsEditForm';
import classNames from 'classnames';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersNewForm = ({successCallback, cancelCallback, prefilledProps, classes}: {
  successCallback?: () => void,
  cancelCallback?: () => void,
  prefilledProps?: Record<string,any>,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classNames(classes.newOrEditForm,classes.newForm)}>
      <h3>Add Chapter</h3>
      <Components.WrappedSmartForm
        collectionName="Chapters"
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        prefilledProps={prefilledProps}
        queryFragmentName={'ChaptersFragment'}
        mutationFragmentName={'ChaptersFragment'}
      />
    </div>
  )
}

const ChaptersNewFormComponent = registerComponent('ChaptersNewForm', ChaptersNewForm, {styles});

declare global {
  interface ComponentTypes {
    ChaptersNewForm: typeof ChaptersNewFormComponent
  }
}

