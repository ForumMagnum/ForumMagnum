import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography/Typography';

const styles = (theme) => ({
  bannerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.palette.primary.main,
    padding: 4,
    zIndex: 1001, // Appear above sunshine sidebar
  },
  text: {
    color: theme.palette.common.white,
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    marginLeft: 4,
    color: theme.palette.common.white,
  },
});

const CookieBanner = ({ classes }) => {
  return (
    <div className={classNames(classes.bannerContainer)}>
      <Typography className={classes.text}>
        We use cookies to enhance your experience on our website. By clicking
        'Accept all', you agree to our use of cookies.
      </Typography>
      <div className={classes.buttonGroup}>
        <Button className={classes.button}>Cookie settings</Button>
        <Button className={classes.button} color="secondary">
          Reject
        </Button>
        <Button className={classes.button} variant="contained" color="secondary">
          Accept all
        </Button>
      </div>
    </div>
  );
};

const CookieBannerComponent = registerComponent('CookieBanner', CookieBanner, {
  styles,
});

declare global {
  interface ComponentTypes {
    CookieBanner: typeof CookieBannerComponent;
  }
}
