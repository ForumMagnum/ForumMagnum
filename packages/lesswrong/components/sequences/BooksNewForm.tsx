import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";

const BooksNewForm = ({successCallback, cancelCallback, prefilledProps}: {
  successCallback?: () => void,
  cancelCallback?: () => void,
  prefilledProps?: Record<string,any>,
}) => {
  return (
    <div className="chapters-new-form">
      <Components.WrappedSmartForm
        collectionName="Books"
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        prefilledProps={prefilledProps}
        fragment={getFragment('BookPageFragment')}
        queryFragment={getFragment('BookPageFragment')}
        mutationFragment={getFragment('BookPageFragment')}
      />
    </div>
  )
}

const BooksNewFormComponent = registerComponent('BooksNewForm', BooksNewForm);

declare global {
  interface ComponentTypes {
    BooksNewForm: typeof BooksNewFormComponent
  }
}

