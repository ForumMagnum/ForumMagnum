import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from "../../lib/analyticsEvents";
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

interface SubscribeWidgetProps extends WithStylesProps {}

const SubscribeWidget = ({ classes }: SubscribeWidgetProps) => {
  const { TabNavigationSubItem, SubscribeDialog } = Components;

  const { captureEvent } = useTracking();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [method, setMethod] = useState("");

  const openDialog = (method: string) => {
    setDialogOpen(true);
    setMethod(method);
    captureEvent("subscribeButtonsClicked", {method: method, dialogOpen: true})
  };

  return (
    <div>
      <a onClick={() => openDialog("rss")} className={classes.root}>
        <TabNavigationSubItem>{isEAForum ? "RSS" : "Subscribe (RSS/Email)"}</TabNavigationSubItem>
      </a>
      { dialogOpen && <SubscribeDialog
        open={true}
        onClose={() => setDialogOpen(false)}
        view={isEAForum ? "frontpage" : "curated"}
        method={method} /> }
    </div>
  )
}

const SubscribeWidgetComponent = registerComponent("SubscribeWidget", SubscribeWidget, { styles });

declare global {
  interface ComponentTypes {
    SubscribeWidget: typeof SubscribeWidgetComponent
  }
}
