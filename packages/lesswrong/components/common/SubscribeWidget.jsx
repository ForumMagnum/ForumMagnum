import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  buttons: {
    display: "inline",
  },
  subscribeButton: {
    top: 2,
    position: "relative",
    display: "inline",
    paddingLeft: theme.spacing.unit,
    color: theme.palette.text.secondary,
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.text.primary
    }
  },
  subscribeLabel: {
    display: "inline",
    cursor: "pointer",
    color: theme.palette.text.secondary
  },
  highlightedLabel: {
    color: theme.palette.text.primary
  }
});

const defaultSubscribeLabel = "";

class SubscribeWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      method: "",
      subscribeLabel: defaultSubscribeLabel
    };
  }

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
      subscribeLabel: defaultSubscribeLabel,
      subscribeLabelHighlighted: false
    });
  }

  render() {
    const { classes, className, view } = this.props;
    const { dialogOpen, method, subscribeLabel, subscribeLabelHighlighted } = this.state;
    const { MetaInfo } = Components
    return (
      <div className={classNames(className, classes.buttons)}>
        <div
          className={classNames(
            { [classes.highlightedLabel]: subscribeLabelHighlighted },
            classes.subscribeLabel)}
          onClick={ () => this.openDialog("email") }
        >
          <MetaInfo>{subscribeLabel}</MetaInfo>
        </div>
        <div
          className={classes.subscribeButton}
          onClick={ () => this.openDialog("rss") }
          onMouseEnter={ () => this.setSubscribeLabel("Subscribe via RSS") }
          onMouseLeave={ () => this.resetSubscribeLabel() }
        >
          <Icon fontSize="inherit" className={classes.icon}>rss_feed</Icon>
        </div>
        <div
          className={classes.subscribeButton}
          onClick={ () => this.openDialog("email") }
          onMouseEnter={ () => this.setSubscribeLabel("Subscribe via Email") }
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
