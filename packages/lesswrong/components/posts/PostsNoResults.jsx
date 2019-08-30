import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    marginLeft: theme.spacing.unit,
    fontStyle: "italic",
    color: theme.palette.grey[500]
  }
});

const PostsNoResults = ({classes}) =>
  <Typography variant="body1" className={classes.root}>
    <FormattedMessage id="posts.no_results"/>
  </Typography>;

registerComponent('PostsNoResults', PostsNoResults,
  withStyles(styles, {name: "PostsNoResults"}));
