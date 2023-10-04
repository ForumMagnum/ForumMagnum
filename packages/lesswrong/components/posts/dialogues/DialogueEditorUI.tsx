// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import { commentBodyStyles } from '../../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[60],
    paddingLeft: 16,
    paddingTop: 12
  },
  info: {
    color: theme.palette.grey[600],
    ...commentBodyStyles(theme),
    margin: '0 !important'
  }
});

export const DialogueEditorUI = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>
    <div>Dialogue Editor</div>
    <div className={classes.info}>
      Have a conversation with other dialogue participants.<br/>
      Everyone can see comments you're writing as you write them.
    </div>
  </div>;
}

const DialogueEditorUIComponent = registerComponent('DialogueEditorUI', DialogueEditorUI, {styles});

declare global {
  interface ComponentTypes {
    DialogueEditorUI: typeof DialogueEditorUIComponent
  }
}
