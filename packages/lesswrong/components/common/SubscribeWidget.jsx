import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import FontIcon from 'material-ui/FontIcon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  icon: {
    fontSize: "14px",
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
      view: props.view,
      karmaThreshold: "2",
      subscriptionMethod: "email",
      dialogOpen: false
    };
  }

  componentWillReceiveProps({ view }) {
    this.setState({ view });
  }

  openDialog(method) {
    this.setState({
      subscriptionMethod: method,
      dialogOpen: true
    });
  }

  render() {
    return (
      <div className={this.props.classes.buttons}>
        <div className={this.props.classes.subscribeButton} onClick={ () => this.openDialog("rss") }>
          <FontIcon className={classNames("material-icons", this.props.classes.icon)}>rss_feed</FontIcon>
        </div>
        <div className={this.props.classes.subscribeButton} onClick={ () => this.openDialog("email") }>
          <FontIcon className={classNames("material-icons", this.props.classes.icon)}>email</FontIcon>
        </div>
        <Components.SubscribeDialog
          open={this.state.dialogOpen}
          onClose={ () => this.setState({ dialogOpen: false })}
          view={this.state.view}
          onViewChange={ (event, view) => this.setState({ view }) }
          threshold={this.state.karmaThreshold}
          onThresholdChange={ (event, karmaThreshold) => this.setState({ karmaThreshold }) }
          method={this.state.subscriptionMethod}
          onMethodChange={ (event, subscriptionMethod) => this.setState({ subscriptionMethod }) }
          className="subscribe-dialog" />
      </div>
    );
  }
}

registerComponent('SubscribeWidget', SubscribeWidget, withStyles(styles));
