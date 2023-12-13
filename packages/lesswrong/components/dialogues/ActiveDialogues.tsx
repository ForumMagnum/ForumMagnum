import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ActiveDialogue, useOnNotificationsChanged } from '../hooks/useUnreadNotifications';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType) => ({
  root: {

  }
});


export const ActiveDialogues = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const [activeDialogues, setActiveDialogues] = useState<ActiveDialogue[]>([]);

  const currentUser = useCurrentUser();

  useOnNotificationsChanged(currentUser, (message) => {
    if (message.eventType === 'activeDialoguePartners') {  
      setActiveDialogues(message.data);
    }
  });

  if (!currentUser) return null;

  return (
    <div className={classes.root}>
      {activeDialogues.map((dialogue) => {
        return (
          <div key={dialogue.postId}>
            {dialogue.displayNames} currently actve in {dialogue.title}
          </div>
        );
      })}
    </div>
  );
}

const ActiveDialoguesComponent = registerComponent('ActiveDialogues', ActiveDialogues, {styles});

declare global {
  interface ComponentTypes {
    ActiveDialogues: typeof ActiveDialoguesComponent
  }
}
