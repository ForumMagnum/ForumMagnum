import React, { useState } from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';
import TabNavigationSubItem from "./TabNavigationMenu/TabNavigationSubItem";
import LWTooltip from "./LWTooltip";

import dynamic from 'next/dynamic';
const SubscribeDialog = dynamic(() => import('./SubscribeDialog'), { ssr: false });

const styles = defineStyles('SubscribeWidget', (theme: ThemeType) => ({
  root: {
    "&:hover": {
},
  },
}));

export const SubscribeWidget = () => {
  const classes = useStyles(styles);

  const { captureEvent } = useTracking();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [method, setMethod] = useState("");

  const openDialog = (method: string) => {
    setDialogOpen(true);
    setMethod(method);
    captureEvent("subscribeButtonsClicked", {method: method, dialogOpen: true})
  };

  return (
    <>
      <LWTooltip placement="right-start" title="Get new posts by RSS, or curated posts by email.">
        <a onClick={() => openDialog("rss")} className={classes.root}>
          <TabNavigationSubItem>Subscribe (RSS/Email)</TabNavigationSubItem>
        </a>
      </LWTooltip>
      { dialogOpen && <SubscribeDialog
        open={true}
        onClose={() => setDialogOpen(false)}
        view="curated"
        method={method} /> }
    </>
  )
}

