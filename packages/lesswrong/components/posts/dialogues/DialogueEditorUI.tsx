// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import { commentBodyStyles } from '../../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[60],
    paddingLeft: 16,
    paddingTop: 12,
    '& ul': {
      paddingLeft: 20
    }
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
  return <div className={classes.root}>
    <div>Dialogue Editor</div>
    <ul className={classes.info}>
      <li>Have a conversation with other dialogue participants.</li>
      <li>Other participants can see comments you're writing as you write them.</li>
      <li>You can edit and publish the dialogue afterwards.</li>
    </ul>
    <p className={classes.info}><em>
      Suggested norms for when to start writing are similar to a real conversation, i.e. you might sometimes interrupt each other or talk over each other briefly, and kinda negotiate who speaks next based on how much people seem to care about typing.
      </em>
    </p>
  </div>;
}

const DialogueEditorUIComponent = registerComponent('DialogueEditorUI', DialogueEditorUI, {styles});

declare global {
  interface ComponentTypes {
    DialogueEditorUI: typeof DialogueEditorUIComponent
  }
}
