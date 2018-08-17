import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

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
  }

  render() {
    const { classes } = this.props;
    if (this.state.error) {
      // You can render any custom fallback UI
      return <Typography
          className={classes.errorText}
          align="center"
          variant="body1">
        Error: {this.state.error}
      </Typography>
    }
    if (this.props.children)
      return this.props.children;
    else
      return null;
  }
}

registerComponent("ErrorBoundary", ErrorBoundary, withStyles(styles));
