import { Components, registerComponent, } from '../../lib/vulcan-lib';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { useGetParameter } from '../common/withGetParameter';
import { forumHeaderTitleSetting } from '../common/Header';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heading: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '1.5em',
  },
  headingText: {
    fontSize: 20,
    margin: 0,
  },
  button: {
    marginTop: '1.5em',
  },
});

const CrosspostLoginPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const token = useGetParameter('token');
  const hasLogo = forumTypeSetting.get() === 'EAForum';

  const {WrappedLoginForm, SiteLogo, Typography} = Components;

  const onConfirm = () => {}

  return (
    <div className={classes.root}>
      <div className={classes.heading}>
        {hasLogo && <SiteLogo />}
        <Typography variant='title' className={classes.headingText}>
          {forumHeaderTitleSetting.get()}
        </Typography>
      </div>
      {currentUser
        ? (
          <>
            <Typography variant='body2'>
              Logged in as {currentUser.displayName}
            </Typography>
            <Button onClick={onConfirm} className={classes.button}>
              Click to connect your account for crossposting
            </Button>
          </>
        )
        : (
          <WrappedLoginForm />
        )
      }
    </div>
  );
}

const CrosspostLoginPageComponent = registerComponent('CrosspostLoginPage', CrosspostLoginPage, {styles});

declare global {
  interface ComponentTypes {
    CrosspostLoginPage: typeof CrosspostLoginPageComponent,
  }
}
