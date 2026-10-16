"use client";

import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import SingleColumnSection from "../common/SingleColumnSection";
import { Typography } from "../common/Typography";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { loginErrorCodes } from '@/lib/auth/loginErrors';

const styles = defineStyles('LoginErrorNotice', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.default,
    width: '100%',
    padding: 32,
    '& a': {
      color: theme.palette.primary.main,
    },
  },
}));

const LoginErrorNotice = ({ error }: { error?: string }) => {
  const classes = useStyles(styles);

  return <SingleColumnSection>
    <div className={classes.root}>
      {error === loginErrorCodes.conflictingAccounts
        ? <Typography variant='body2' gutterBottom>
          Multiple conflicting accounts error: we couldn't log you in because more than one
          account is associated with this login's email address. Please{' '}
          <Link to='/contact'>contact support</Link> so we can sort it out.
        </Typography>
        : <Typography variant='body2' gutterBottom>
          Sorry, something went wrong while logging you in. You can{' '}
          <Link to='/login'>try again</Link>, and if the problem persists,
          please <Link to='/contact'>contact support</Link>.
        </Typography>
      }
    </div>
  </SingleColumnSection>
}

export default LoginErrorNotice;
