import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginLeft: 10,
    marginTop: 15,
    fontSize: 18,
    fontStyle: "italic",
  }
});

const PostsNoResults = props =>
  <p className="posts-no-results">
    <FormattedMessage id="posts.no_results"/>
  </p>;

PostsNoResults.displayName = "PostsNoResults";

registerComponent('PostsNoResults', PostsNoResults,
  withStyles(styles, {name: "PostsNoResults"}));
