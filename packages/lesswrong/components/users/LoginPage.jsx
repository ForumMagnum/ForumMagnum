import { Components, registerComponent, } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withNavigation } from '../../lib/routeUtil';
import withUser from '../common/withUser';

class LoginPage extends Component {
  UNSAFE_componentWillMount() {
    // If already logged in, redirect to the front page
    if (this.props.currentUser) {
      this.props.history.push({pathname: "/"});
    }
  }
  
  render() {
    if (this.props.currentUser) {
      // If already logged in, leave page body blank. You won't see it for more
      // than a flash anyways because a redirect will have been started by
      // `componentWillMount`.
      return <div />
    } else {
      return <Components.WrappedLoginForm />;
    }
  }
}

registerComponent('LoginPage', LoginPage, withUser, withNavigation);
