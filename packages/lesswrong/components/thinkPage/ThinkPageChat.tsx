import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '100%',
    maxWidth: 300,
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  }
});

export const ThinkPageChat = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { LanguageModelChat } = Components;
  return <div className={classes.root}>
    <LanguageModelChat hideHeader={true} />
  </div>;
}

const ThinkPageChatComponent = registerComponent('ThinkPageChat', ThinkPageChat, {styles});

declare global {
  interface ComponentTypes {
    ThinkPageChat: typeof ThinkPageChatComponent
  }
}
