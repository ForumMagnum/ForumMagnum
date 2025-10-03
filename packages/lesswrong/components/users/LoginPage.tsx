"use client";

import React, { useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useNavigate } from '../../lib/routeUtil';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LoginForm from "./LoginForm";

const styles = defineStyles("LoginPage", (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    height: "100vh",
  },
}));

const LoginPage = () => {
  const classes = useStyles(styles);
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
    return <div className={classes.root}>
      <LoginForm />
    </div>;
  }
}

export default registerComponent('LoginPage', LoginPage);


