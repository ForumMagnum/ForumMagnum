import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

// TODO these styles are awful
const styles = theme => ({
  subscribeButton: {
    position: "relative",
    top: "1px",
    display: "inline-block",
    paddingLeft: theme.spacing.unit,
    opacity: "0.4",
    "&:hover": {
      opacity: "1.0"
    }
  },
  subscribeLabel: {
    color: "black",
    display: "inline-block",
    opacity: "0.4",
    fontStyle: "normal"
  },
  highlightedLabel: {
    opacity: "1.0"
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
    const { classes, view } = this.props;
    const { dialogOpen, method, subscribeLabel, subscribeLabelHighlighted } = this.state;

    return (
      <div className={classes.buttons}>
        <div
          className={classNames(
            { [classes.highlightedLabel]: subscribeLabelHighlighted },
            classes.subscribeLabel)}
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

registerComponent('SubscribeWidget', SubscribeWidget, withStyles(styles));
