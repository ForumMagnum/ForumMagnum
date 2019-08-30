import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import * as Sentry from '@sentry/browser';

const styles = theme => ({
  errorText: {
    color: theme.palette.error.main,
  }
})


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }

  componentDidCatch(error, info) {
    this.setState({ error: error.toString() });
    Sentry.configureScope(scope => {
      Object.keys(info).forEach(key => {
        scope.setExtra(key, info[key]);
      });
    });
    Sentry.captureException(error);
  }

  render() {
    const { classes } = this.props;
    if (this.state.error) {
      // You can render any custom fallback UI
      return <Typography
          className={classes.errorText}
          align="center"
          variant="body2">
        Error: {this.state.error}
      </Typography>
    }
    if (this.props.children)
      return this.props.children;
    else
      return null;
  }
}

registerComponent("ErrorBoundary", ErrorBoundary, withStyles(styles, { name: "ErrorBoundary" }));
