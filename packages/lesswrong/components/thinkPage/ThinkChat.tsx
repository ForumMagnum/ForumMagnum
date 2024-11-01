import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    position: 'absolute',
    top: "calc(100vh - 100px)",
    right: 0,
    width: '100%',
    maxWidth: 425,
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  }
});

export const ThinkChat = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { LanguageModelChat } = Components;
  return <div className={classes.root}>
    <LanguageModelChat hideHeader={true} />
  </div>;
}

const ThinkChatComponent = registerComponent('ThinkChat', ThinkChat, {styles});

declare global {
  interface ComponentTypes {
    ThinkChat: typeof ThinkChatComponent
  }
}
