import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';

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

