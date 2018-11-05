import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import Sequences from '../../lib/collections/sequences/collection.js';
import withUser from '../common/withUser';

const SequencesNewForm = (props, context) => {
  if (props.currentUser) {
    return (
      <div className="sequences-new-form">
        <Components.SmartForm
          collection={Sequences}
          successCallback={(sequence) => {
            props.router.push({pathname: props.redirect || '/s/' + sequence._id });
            props.flash({messageString: "Successfully created Sequence", type: "success"});
          }}
          cancelCallback={props.cancelCallback}
          removeSuccessCallback={props.removeSuccessCallback}
          prefilledProps={{userId: props.currentUser._id}}
          fragment={getFragment('SequencesPageFragment')}
          queryFragment={getFragment('SequencesPageFragment')}
          mutationFragment={getFragment('SequencesPageFragment')}
        />
      </div>
    )
  } else {
    return <h3>You must be logged in to create a new sequence.</h3>
  }
}

registerComponent('SequencesNewForm', SequencesNewForm, withMessages, withRouter, withUser);
