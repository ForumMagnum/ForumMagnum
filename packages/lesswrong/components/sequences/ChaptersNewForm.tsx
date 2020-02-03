import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import Chapters from '../../lib/collections/chapters/collection';

//TODO: Manage chapter removal to remove the reference from all parent-sequences

const ChaptersNewForm = ({successCallback, cancelCallback, prefilledProps}: {
  successCallback?: ()=>void,
  cancelCallback?: ()=>void,
  prefilledProps?: Record<string,any>,
}) => {
  return (
    <div className="chapters-new-form">
      <h3>Add Chapter</h3>
      <Components.WrappedSmartForm
        collection={Chapters}
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

const ChaptersNewFormComponent = registerComponent('ChaptersNewForm', ChaptersNewForm);

declare global {
  interface ComponentTypes {
    ChaptersNewForm: typeof ChaptersNewFormComponent
  }
}

