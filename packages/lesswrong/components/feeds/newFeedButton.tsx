import React from 'react';
import Button from '@material-ui/core/Button';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import { useCurrentUser } from '../common/withUser';

//
// Button used to add a new feed to a user profile
//
const NewFeedButton = ({user, closeModal}: {
  user: any,
  closeModal?: any
}) => {
  const currentUser = useCurrentUser();

  if (user && currentUser) {
    return (
      <div>
        <Components.WrappedSmartForm
          collection={RSSFeeds}
          mutationFragment={getFragment('newRSSFeedFragment')}
          prefilledProps={{userId: user._id}}
          successCallback={() => {
            closeModal();
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

const newFeedButtonComponent = registerComponent('newFeedButton', NewFeedButton);

declare global {
  interface ComponentTypes {
    newFeedButton: typeof newFeedButtonComponent
  }
}
