import React, { Component } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Hidden from '@material-ui/core/Hidden';
import { withTracking } from "../../lib/analyticsEvents";

interface ExternalProps {
  view: string,
}
interface SubscribeWidgetProps extends ExternalProps, WithTrackingProps {
}
interface SubscribeWidgetState {
  dialogOpen: boolean,
  method: string,
}
class SubscribeWidget extends Component<SubscribeWidgetProps,SubscribeWidgetState> {
  state: SubscribeWidgetState = {
    dialogOpen: false,
    method: "",
  }

  openDialog(method: string) {
    this.setState({ dialogOpen: true, method });
    this.props.captureEvent("subscribeButtonsClicked", {method: method, dialogOpen: true})
  }

  render() {
    const { SeparatorBullet } = Components;
    const { view } = this.props;
    const { dialogOpen, method } = this.state;

    return (
      <React.Fragment>
        <a onClick={ () => this.openDialog("rss") }>
          { /* On very small screens, use shorter link text ("Subscribe (RSS)"
               instead of "Subscribe via RSS") to avoid wrapping */ }
          <Hidden smUp implementation="css">Subscribe (RSS)</Hidden>
          <Hidden xsDown implementation="css">Subscribe via RSS</Hidden>
          {/* todo: change back to "via RSS" */}
        </a>
        <SeparatorBullet />
        <a onClick={ () => this.openDialog("email") }>
          <Hidden smUp implementation="css">Subscribe (Email)</Hidden> 
          <Hidden xsDown implementation="css">Subscribe via Email</Hidden> 
          {/* todo: change back to "via Email" */}
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

const SubscribeWidgetComponent = registerComponent<ExternalProps>("SubscribeWidget", SubscribeWidget, {
  hocs: [withTracking]
});

declare global {
  interface ComponentTypes {
    SubscribeWidget: typeof SubscribeWidgetComponent
  }
}
