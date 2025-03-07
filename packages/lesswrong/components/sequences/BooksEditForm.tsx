import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

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
        queryFragmentName={'BookEdit'}
        mutationFragmentName={'BookPageFragment'}
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

