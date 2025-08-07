import React, { useState } from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import { isEAForum } from '../../lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';
import { defineStyles, useStyles } from '../hooks/useStyles';
import TabNavigationSubItem from "./TabNavigationMenu/TabNavigationSubItem";
import dynamic from 'next/dynamic';

const styles = defineStyles('SubscribeWidget', (theme: ThemeType) => ({
  root: {
    "&:hover": {
      opacity: isFriendlyUI ? 1 : undefined,
      color: isFriendlyUI ? theme.palette.grey[800] : undefined,
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

  const SubscribeDialog = dynamic(() => import('./SubscribeDialog'), { ssr: false });

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

