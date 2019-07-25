import React from 'react';
import withUser from '../common/withUser';
import { Components, registerComponent } from 'meteor/vulcan:core';

const ShortformSubmitForm = ({currentUser, successCallback}) => {
  const { CommentsNewForm } = Components;
  const shortformFeedId = currentUser?.shortformFeedId

  return (
    <CommentsNewForm
      post={{_id:shortformFeedId}} 
      prefilledProps={{shortform: true}}
      mutationFragment={"ShortformCommentsList"}
      successCallback={successCallback}
      type="comment"
    />
    
  );
}

registerComponent('ShortformSubmitForm', ShortformSubmitForm, withUser);