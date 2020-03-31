import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { FormattedMessage } from '../../lib/vulcan-i18n';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    marginLeft: theme.spacing.unit,
    fontStyle: "italic",
    color: theme.palette.grey[500]
  }
});

const PostsNoResults = ({classes}) =>
  <Typography variant="body2" className={classes.root}>
    <FormattedMessage id="posts.no_results"/>
  </Typography>;

const PostsNoResultsComponent = registerComponent('PostsNoResults', PostsNoResults, {styles});

declare global {
  interface ComponentTypes {
    PostsNoResults: typeof PostsNoResultsComponent
  }
}

