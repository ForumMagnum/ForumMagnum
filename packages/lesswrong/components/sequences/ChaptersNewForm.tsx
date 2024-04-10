import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import Chapters from '../../lib/collections/chapters/collection';
import { styles } from './CollectionsEditForm';
import classNames from 'classnames';

//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersNewForm = ({successCallback, cancelCallback, prefilledProps, classes}: {
  successCallback?: () => void,
  cancelCallback?: () => void,
  prefilledProps?: Record<string,any>,
  classes: ClassesType,
}) => {
  return (
    <div className={classNames(classes.newOrEditForm,classes.newForm)}>
      <h3>Add Chapter</h3>
      <Components.WrappedSmartForm
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

