import React, { useEffect } from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useNavigate } from '../../lib/reactRouterWrapper';

const LoginPage = () => {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to the front page
    if (currentUser) {
      navigate({pathname: "/"});
    }
  }, [currentUser, navigate]);

  if (currentUser) {
    // If already logged in, leave page body blank. You won't see it for more
    // than a flash anyways because a redirect will have been started by
    // `componentWillMount`.
    return <div />;
  } else {
    return <Components.LoginForm />;
  }
}

const LoginPageComponent = registerComponent('LoginPage', LoginPage);

declare global {
  interface ComponentTypes {
    LoginPage: typeof LoginPageComponent
  }
}
