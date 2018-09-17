import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Collections from '../../lib/collections/collections/collection.js';
import defineComponent from '../../lib/defineComponent';

const CollectionsEditForm = (props) => {
  return (
    <div className="chapters-edit-form">
      <Components.SmartForm
        collection={Collections}
        documentId={props.documentId}
        successCallback={props.successCallback}
        cancelCallback={props.cancelCallback}
        showRemove={true}
        fragment={getFragment('CollectionsPageFragment')}
        queryFragment={getFragment('CollectionsPageFragment')}
        mutationFragment={getFragment('CollectionsPageFragment')}
      />
    </div>
  )
}

export default defineComponent({
  name: 'CollectionsEditForm',
  component: CollectionsEditForm,
  hocs: [ withMessages ]
});
