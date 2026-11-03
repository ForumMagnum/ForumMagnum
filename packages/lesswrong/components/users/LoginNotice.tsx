"use client";

import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { loginErrorCodes, loginWarningCodes, sanitizeLoginReturnTo } from '@/lib/auth/loginNotices';

const styles = defineStyles('LoginNotice', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.default,
    width: '100%',
    padding: 32,
    '& a': {
      color: theme.palette.primary.main,
    },
  },
}));

const LoginNoticeMessage = ({ error, warning, returnTo }: {
  error?: string,
  warning?: string,
  returnTo?: string,
}) => {
  if (warning === loginWarningCodes.conflictingAccounts) {
    return <Typography variant='body2' gutterBottom>
      You're logged in, but we detected multiple accounts associated with this login's email
      address. Please <Link to='/contact'>contact support</Link> so we can sort it out.{' '}
      <Link to={sanitizeLoginReturnTo(returnTo)}>Continue</Link>
    </Typography>;
  }

  if (error === loginErrorCodes.conflictingAccounts) {
    return <Typography variant='body2' gutterBottom>
      Multiple conflicting accounts error: we couldn't log you in because more than one
      account is associated with this login's email address. Please{' '}
      <Link to='/contact'>contact support</Link> so we can sort it out.
    </Typography>;
  }

  return <Typography variant='body2' gutterBottom>
    Sorry, something went wrong while logging you in. You can{' '}
    <Link to='/login'>try again</Link>, and if the problem persists,
    please <Link to='/contact'>contact support</Link>.
  </Typography>;
}

const LoginNotice = ({ error, warning, returnTo }: {
  error?: string,
  warning?: string,
  returnTo?: string,
}) => {
  const classes = useStyles(styles);

  return <SingleColumnSection>
    <div className={classes.root}>
      <LoginNoticeMessage error={error} warning={warning} returnTo={returnTo} />
    </div>
  </SingleColumnSection>
}

export default LoginNotice;
