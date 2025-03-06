import React from 'react';
import { styles } from './CollectionsEditForm';
import classNames from 'classnames';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";

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
      <WrappedSmartForm
        collectionName="Chapters"
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        prefilledProps={prefilledProps}
        fragment={getFragment('ChaptersFragment')}
        queryFragment={getFragment('ChaptersFragment')}
        mutationFragment={getFragment('ChaptersFragment')}
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

export default ChaptersNewFormComponent;

