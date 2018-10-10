import React from 'react';
import { registerComponent, getSetting } from 'meteor/vulcan:core';
import { withStyles, withTheme } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    height: 48
  }
})

const SiteLogo = ({classes}) => getSetting('logoUrl', null) && <img
  className={classes.root}
  src={getSetting('logoUrl')}
  title={getSetting('title')}
  alt={`${getSetting('title')} Logo`}
/>

Logo.displayName = "SiteLogo";

registerComponent('SiteLogo', SiteLogo, withStyles(styles), withTheme());
