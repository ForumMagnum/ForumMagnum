import { Components, registerComponent, withCurrentUser, } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withRouter } from 'react-router';
import defineComponent from '../../lib/defineComponent';

class LoginPage extends Component {
  UNSAFE_componentWillMount() {
    // If already logged in, redirect to the front page
    if (this.props.currentUser) {
      this.props.router.push({pathanme: "/"});
    }
  }
  
  render() {
    if (this.props.currentUser) {
      // If already logged in, leave page body blank. You won't see it for more
      // than a flash anyways because a redirect will have been started by
      // `componentWillMount`.
      return <div />
    } else {
      return <Components.AccountsLoginForm />;
    }
  }
}

export default defineComponent({
  name: 'LoginPage',
  component: LoginPage,
  hocs: [ withCurrentUser, withRouter ]
});
