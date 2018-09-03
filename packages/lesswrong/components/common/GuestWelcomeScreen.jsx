import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';


const styles = theme => ({
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.unit * 2
  },
  body: {
    fontSize: 18
  }
})

const GuestWelcomeScreen = ({classes}) => <div>
  <Grid container justify={'center'} className={classes.root} spacing={24}>
    <Grid item md={8} xs={12}>
      <Components.Logo />
    </Grid>
  </Grid>
  <Grid container justify={'center'} className={classes.root} spacing={24}>
    <Grid item md={8} xs={12}>
      <Typography variant='display3' className={classes.title}>
        Thanks for checking out the new Effective Altruism Forum
      </Typography>
      <Typography variant='body' className={classes.body}>
        <p>
          We're still in private beta mode. If you've already been registered,{' '}
          please click <strong>LOGIN</strong> in the menu bar to log in and start posting.
        </p>
        <p>
          We'll be opening the beta up to everyone in a couple of weeks. If you're{' '}
          already registered on{' '}
          <a href='https://effective-altruism.com'>
            the existing Effective Altruism Forum (effective-altruism.com)
          </a>{' '}
          your data will be automatically moved when we move out of beta mode.
        </p>
        <p>
          You can read{' '}
          <a href='http://effective-altruism.com/ea/1qv/ea_forum_20_initial_announcement/'>
            this post
          </a>{' '}
          for more info about the move to the new forum.
        </p>
        <p>
          Thanks for your patience,<br />
          <strong>The EA Forum team</strong>
        </p>
      </Typography>
    </Grid>
  </Grid>
</div>

GuestWelcomeScreen.displayName = "Guest Welcome Screen";

registerComponent('GuestWelcomeScreen', GuestWelcomeScreen, withStyles(styles), withTheme());
