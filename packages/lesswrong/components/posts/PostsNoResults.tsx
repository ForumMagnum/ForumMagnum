import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = createStyles(theme => ({
  root: {
    marginLeft: theme.spacing.unit,
    fontStyle: "italic",
    color: theme.palette.grey[500]
  }
}));

const PostsNoResults = ({classes}) =>
  <Typography variant="body2" className={classes.root}>
    <FormattedMessage id="posts.no_results"/>
  </Typography>;

const PostsNoResultsComponent = registerComponent('PostsNoResults', PostsNoResults,
  withStyles(styles, {name: "PostsNoResults"}));

declare global {
  interface ComponentTypes {
    PostsNoResults: typeof PostsNoResultsComponent
  }
}

