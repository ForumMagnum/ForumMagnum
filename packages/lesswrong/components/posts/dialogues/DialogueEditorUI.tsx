// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const DialogueEditorUI = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>
    Dialogues
  </div>;
}

const DialogueEditorUIComponent = registerComponent('DialogueEditorUI', DialogueEditorUI, {styles});

declare global {
  interface ComponentTypes {
    DialogueEditorUI: typeof DialogueEditorUIComponent
  }
}
