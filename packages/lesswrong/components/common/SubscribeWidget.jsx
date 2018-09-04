import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  buttons: {
    display: "inline"
  },
  subscribeButton: {
    position: "relative",
    top: "2px",
    display: "inline",
    paddingLeft: theme.spacing.unit,
    color: theme.palette.text.secondary,
    "&:hover": {
      color: theme.palette.text.primary
    }
  },
  subscribeLabel: {
    display: "inline",
    color: theme.palette.text.secondary
  },
  highlightedLabel: {
    color: theme.palette.text.primary
  }
});

class SubscribeWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      method: "",
      subscribeLabel: this.getDefaultSubscribeLabel()
    };
  }

  getDefaultSubscribeLabel = () => "Subscribe"

  openDialog(method) {
    this.setState({ dialogOpen: true, method });
  }

  setSubscribeLabel(label) {
    this.setState({
      subscribeLabel: label,
      subscribeLabelHighlighted: true
    });
  }

  resetSubscribeLabel() {
    this.setState({
      subscribeLabel: this.getDefaultSubscribeLabel(),
      subscribeLabelHighlighted: false
    });
  }

  render() {
    const { classes, className, view } = this.props;
    const { dialogOpen, method, subscribeLabel, subscribeLabelHighlighted } = this.state;

    return (
      <div className={classNames(className, classes.buttons)}>
        <div
          className={classNames(
            { [classes.highlightedLabel]: subscribeLabelHighlighted },
            classes.subscribeLabel)}
          onClick={ () => this.openDialog("email") }
        >
          {subscribeLabel}
        </div>
        <div
          className={classes.subscribeButton}
          onClick={ () => this.openDialog("rss") }
          onMouseEnter={ () => this.setSubscribeLabel("Via RSS") }
          onMouseLeave={ () => this.resetSubscribeLabel() }
        >
          <Icon fontSize="inherit" className={classes.icon}>rss_feed</Icon>
        </div>
        <div
          className={classes.subscribeButton}
          onClick={ () => this.openDialog("email") }
          onMouseEnter={ () => this.setSubscribeLabel("Via Email") }
          onMouseLeave={ () => this.resetSubscribeLabel() }
        >
          <Icon fontSize="inherit" className={classes.icon}>email</Icon>
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

registerComponent('SubscribeWidget', SubscribeWidget, withStyles(styles, { name: "SubscribeWidget" }));
