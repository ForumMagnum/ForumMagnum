import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";

const BooksEditForm = ({documentId, successCallback, cancelCallback, prefilledProps}: {
  documentId: string,
  successCallback?: () => void,
  cancelCallback?: () => void,
  prefilledProps?: Record<string,any>,
}) => {
  return (
    <div className="books-edit-form">
      <Components.WrappedSmartForm
        collectionName="Books"
        documentId={documentId}
        successCallback={successCallback}
        cancelCallback={cancelCallback}
        prefilledProps={prefilledProps}
        showRemove={true}
        queryFragment={getFragment('BookEdit')}
        mutationFragment={getFragment('BookPageFragment')}
      />
    </div>
  )
}

const BooksEditFormComponent = registerComponent('BooksEditForm', BooksEditForm);

declare global {
  interface ComponentTypes {
    BooksEditForm: typeof BooksEditFormComponent
  }
}

