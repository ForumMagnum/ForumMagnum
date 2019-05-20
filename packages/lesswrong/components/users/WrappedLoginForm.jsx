import { registerComponent } from 'meteor/vulcan:core';

const WrappedLoginForm = ({}) => {
  return <Components.AccountsLoginForm />
}

registerComponent('WrappedLoginForm', WrappedLoginForm);
