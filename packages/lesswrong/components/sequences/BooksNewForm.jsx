import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import Books from '../../lib/collections/books/collection.js';

const BooksNewForm = (props) => {
  return (
    <div className="chapters-new-form">
      <Components.WrappedSmartForm
        collection={Books}
        successCallback={props.successCallback}
        cancelCallback={props.cancelCallback}
        prefilledProps={props.prefilledProps}
        fragment={getFragment('BookPageFragment')}
        queryFragment={getFragment('BookPageFragment')}
        mutationFragment={getFragment('BookPageFragment')}
      />
    </div>
  )
}

registerComponent('BooksNewForm', BooksNewForm, withMessages);
