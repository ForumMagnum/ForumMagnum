import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import { withMessages } from '../common/withMessages';
import React from 'react';
import Books from '../../lib/collections/books/collection';

const BooksEditForm = (props) => {
  return (
    <div className="books-edit-form">
      <Components.WrappedSmartForm
        collection={Books}
        documentId={props.documentId}
        successCallback={props.successCallback}
        cancelCallback={props.cancelCallback}
        prefilledProps={props.prefilledProps}
        showRemove={true}
        queryFragment={getFragment('BookEdit')}
        mutationFragment={getFragment('BookPageFragment')}
      />
    </div>
  )
}

registerComponent('BooksEditForm', BooksEditForm, withMessages);
