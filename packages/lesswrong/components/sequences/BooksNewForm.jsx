import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import { withMessages } from '../common/withMessages';
import React from 'react';
import Books from '../../lib/collections/books/collection';

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
