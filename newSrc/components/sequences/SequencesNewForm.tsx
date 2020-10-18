import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { useNavigation } from '../../lib/routeUtil';
import Sequences from '../../lib/collections/sequences/collection';
import { useCurrentUser } from '../common/withUser';

const SequencesNewForm = ({ redirect, cancelCallback, removeSuccessCallback}: {
  redirect: any,
  cancelCallback: any,
  removeSuccessCallback: any,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
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

const SequencesNewFormComponent = registerComponent('SequencesNewForm', SequencesNewForm);

declare global {
  interface ComponentTypes {
    SequencesNewForm: typeof SequencesNewFormComponent
  }
}

