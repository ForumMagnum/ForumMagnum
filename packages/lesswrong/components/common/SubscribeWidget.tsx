import React, { Component } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { withTracking } from "../../lib/analyticsEvents";
import { isEAForum } from '../../lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    "&:hover": {
      opacity: isFriendlyUI ? 1 : undefined,
      color: isFriendlyUI ? theme.palette.grey[800] : undefined,
    },
  },
});

interface SubscribeWidgetProps extends WithTrackingProps {}
interface SubscribeWidgetProps extends WithStylesProps {}
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
        <a onClick={() => this.openDialog("rss")} className={this.props.classes.root}>
          <TabNavigationSubItem>{isEAForum ? "RSS" : "Subscribe (RSS/Email)"}</TabNavigationSubItem>
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
  styles,
  hocs: [withTracking]
});

declare global {
  interface ComponentTypes {
    SubscribeWidget: typeof SubscribeWidgetComponent
  }
}
