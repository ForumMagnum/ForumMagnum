import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';
import withUser from '../common/withUser';

//
// Button used to add a new feed to a user profile
//
class newFeedButton extends Component {

  render() {

    const user = this.props.user;
    const currentUser = this.props.currentUser;

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
          <Button onClick={() => this.props.closeModal()}>Close</Button>
        </div>
      )
    } else {
      return <div> <Components.Loading /> </div>
    }
  }
}

registerComponent('newFeedButton', newFeedButton, withUser, withRouter);
