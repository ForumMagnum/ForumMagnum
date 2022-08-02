import React, { Component } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { withTracking } from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';

const isEAForum = forumTypeSetting.get() === 'EAForum'

interface SubscribeWidgetProps extends WithTrackingProps {
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
    const { TabNavigationSubItem, SubscribeDialog } = Components;
    const { dialogOpen, method } = this.state;

    return (
      <div>
        <a onClick={() => this.openDialog("rss")}>
          <TabNavigationSubItem>Subscribe (RSS{!isEAForum && '/Email'})</TabNavigationSubItem>
        </a>
        { dialogOpen && <SubscribeDialog
          open={true}
          onClose={ () => this.setState({ dialogOpen: false })}
          view={isEAForum ? "frontpage" : "curated"}
          method={method} /> }
      </div>
    )
  }
}

const SubscribeWidgetComponent = registerComponent("SubscribeWidget", SubscribeWidget, {
  hocs: [withTracking]
});

declare global {
  interface ComponentTypes {
    SubscribeWidget: typeof SubscribeWidgetComponent
  }
}
