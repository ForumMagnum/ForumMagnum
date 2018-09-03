import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';


const styles = theme => ({
  root: {
    a: {
      textDecoration: 'underline'
    }
  },
  title: {
    textAlign: 'center',
    margin: `0 0 ${theme.spacing.unit * 2}px`
  },
  body: {
    fontSize: 18
  },
  logoWrapper: {
    textAlign: 'center',
    marginBottom: theme.spacing.unit
  },
  logo: {
    display: 'inline-block'
  }
})

const GuestWelcomeScreen = ({classes}) => <div className={classes.root}>
  <div className={classes.logoWrapper}>
    <Components.Logo className={classes.logo} />
  </div>
  <Grid container justify={'center'}>
    <Grid item xs={12} sm={8} md={6}>
      <Typography variant='display3' component='h3' className={classes.title}>
        Forum in Private Beta
      </Typography>
      <Typography variant='body' className={classes.body}>
        <p>
          Thanks for checking out the new Effective Altruism Forum.{' '}
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
