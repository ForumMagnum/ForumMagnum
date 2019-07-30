import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';

class SubscribeWidget extends Component {
  state = {
      dialogOpen: false,
      method: "",
  }

  openDialog(method) {
    this.setState({ dialogOpen: true, method });
  }

  render() {
    const { view } = this.props;
    const { dialogOpen, method } = this.state;

    return (
      <React.Fragment>
        <a onClick={ () => this.openDialog("rss") }>
          Subscribe via RSS
        </a>
        <a onClick={ () => this.openDialog("email") }>
          Subscribe via Email
        </a>
        { dialogOpen && <Components.SubscribeDialog
          open={true}
          onClose={ () => this.setState({ dialogOpen: false })}
          view={view}
          method={method} /> }
      </React.Fragment>
    )
  }
}

registerComponent('SubscribeWidget', SubscribeWidget);
