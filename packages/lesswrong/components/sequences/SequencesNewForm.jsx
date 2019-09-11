import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import { useNavigation } from '../../lib/routeUtil';
import Sequences from '../../lib/collections/sequences/collection.js';
import withUser from '../common/withUser';

const SequencesNewForm = ({ currentUser, flash, redirect, cancelCallback, removeSuccessCallback}) => {
  const { history } = useNavigation();
  
  if (currentUser) {
    return (
      <div className="sequences-new-form">
        <Components.WrappedSmartForm
          collection={Sequences}
          successCallback={(sequence) => {
            history.push({pathname: redirect || '/s/' + sequence._id });
            flash({messageString: "Successfully created Sequence", type: "success"});
          }}
          cancelCallback={cancelCallback}
          removeSuccessCallback={removeSuccessCallback}
          prefilledProps={{userId: currentUser._id}}
          queryFragment={getFragment('SequencesEdit')}
          mutationFragment={getFragment('SequencesPageFragment')}
        />
      </div>
    )
  } else {
    return <h3>You must be logged in to create a new sequence.</h3>
  }
}

registerComponent('SequencesNewForm', SequencesNewForm, withMessages, withUser);
