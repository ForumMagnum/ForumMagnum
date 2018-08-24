import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import FontIcon from 'material-ui/FontIcon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  icon: {
    color: "black",
  },
  subscribeButton: {
    display: "inline-block",
    marginLeft: theme.spacing.unit,
    opacity: "0.4",
    "&:hover": {
      opacity: "0.15"
    }
  },
  buttons: {
    marginTop: -(theme.spacing.unit * 2),
    marginBottom: theme.spacing.unit
  }
});

class SubscribeWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      method: ""
    };
  }

  openDialog(method) {
    this.setState({ dialogOpen: true, method });
  }

  render() {
    const { classes, view } = this.props;
    const { dialogOpen, method } = this.state;

    return (
      <div className={classes.buttons}>
        <div className={classes.subscribeButton} onClick={ () => this.openDialog("rss") }>
          <FontIcon className={classNames("material-icons", classes.icon)}>rss_feed</FontIcon>
        </div>
        <div className={classes.subscribeButton} onClick={ () => this.openDialog("email") }>
          <FontIcon className={classNames("material-icons", classes.icon)}>email</FontIcon>
        </div>
        { dialogOpen && <Components.SubscribeDialog
          open={true}
          onClose={ () => this.setState({ dialogOpen: false })}
          view={view}
          method={method} /> }
      </div>
    );
  }
}

registerComponent('SubscribeWidget', SubscribeWidget, withStyles(styles));
