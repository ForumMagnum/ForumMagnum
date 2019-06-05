import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import { Link } from '../../lib/reactRouterWrapper.js';

const styles = (theme) => ({
  root: {
    paddingLeft: 4,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: ".9rem",
    color: theme.palette.grey[600],
  }
})

const BetaTag = ({classes}) => {
  return <Tooltip placement="right" title="This feature is in beta-testing. You can send feedback to us about it via intercom. If it's currently buggy and you don't want to deal with it, you can turn off your beta settings in your user profile">
    <span className={classes.root}>[Beta]</span>
  </Tooltip>
}

registerComponent('BetaTag', BetaTag, withStyles(styles, {name: 'BetaTag'}))