/*

Button used to add a new feed to a user profile

*/

import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import { Components, getFragment } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';
import defineComponent from '../../lib/defineComponent';
import withUser from '../common/withUser';

class newFeedButton extends Component {

  render() {

    const user = this.props.user;
    const currentUser = this.props.currentUser;

    if (user && currentUser) {
      return (
        <div>
          <Components.SmartForm
            collection={RSSFeeds}
            mutationFragment={getFragment('newRSSFeedFragment')}
            prefilledProps={{userId: user._id}}
            successCallback={conversation => {
              this.props.closeModal();
            }}
          >
            </ Components.SmartForm>
            <FlatButton onClick={() => this.props.closeModal()} label="Close"/>
        </div>
      )
    } else {
      return <div> <Components.Loading /> </div>
    }
  }
}

export default defineComponent({
  name: 'newFeedButton',
  component: newFeedButton,
  hocs: [ withUser, withRouter ]
});
