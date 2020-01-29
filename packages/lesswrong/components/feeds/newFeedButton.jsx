import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import { useCurrentUser } from '../common/withUser';

//
// Button used to add a new feed to a user profile
//
const newFeedButton = ({user}) => {
  const currentUser = useCurrentUser();

  if (user && currentUser) {
    return (
      <div>
        <Components.WrappedSmartForm
          collection={RSSFeeds}
          mutationFragment={getFragment('newRSSFeedFragment')}
          prefilledProps={{userId: user._id}}
          successCallback={conversation => {
            this.props.closeModal();
          }}
        />
        {/*FIXME: This close button doesn't work (closeModal is not a thing)*/}
        <Button onClick={() => closeModal()}>Close</Button>
      </div>
    )
  } else {
    return <div> <Components.Loading /> </div>
  }
}

const newFeedButtonComponent = registerComponent('newFeedButton', newFeedButton);

declare global {
  interface ComponentTypes {
    newFeedButton: typeof newFeedButtonComponent
  }
}
