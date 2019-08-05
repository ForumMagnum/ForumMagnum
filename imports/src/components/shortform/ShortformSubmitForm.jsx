import React from 'react';
import withUser from '../common/withUser';
import { Components, registerComponent } from 'vulcan:core';

const ShortformSubmitForm = ({currentUser, successCallback}) => {
  const { CommentsNewForm } = Components;

  return (
    <CommentsNewForm
      prefilledProps={{shortform: true}}
      fragment={"ShortformCommentsList"}
      successCallback={successCallback}
      type="comment"
    />
    
  );
}

registerComponent('ShortformSubmitForm', ShortformSubmitForm, withUser);