import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ActiveDialogue, useOnNotificationsChanged } from '../hooks/useUnreadNotifications';
import { useCurrentUser } from '../common/withUser';
import { postGetEditUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import {truncate} from '../../lib/editor/ellipsize';

const styles = (theme: ThemeType) => ({
  root: {
    position: 'absolute',
    top: "50%",
    left: "50%",
    transform: 'translate(-50%, -50%)',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  activeDot: {
    height: 10,
    width: 10,
    backgroundColor: theme.palette.lwTertiary.main,
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: `0 0 10px ${theme.palette.lwTertiary.main}, 0 0 20px ${theme.palette.lwTertiary.main}, 0 0 30px ${theme.palette.lwTertiary.main}, 0 0 40px ${theme.palette.lwTertiary.main}`,
    marginRight: 15,
  },
  activeAuthorNames: {
      
  },
  activeDialogueTitle: {

  },
  activeDialogueContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  dialogueDetailsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  }
});


export const ActiveDialogues = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { PostsTooltip, PostsItem2MetaInfo } = Components

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
          <div className={classes.activeDialogueContainer} key={dialogue.postId}>
             <div className={classes.activeDot}></div>
             <div className={classes.dialogueDetailsContainer}> 
              <PostsItem2MetaInfo className={classes.activeAuthorNames}> {dialogue.displayNames} </PostsItem2MetaInfo> 
              <div className={classes.activeDialogueTitle}> 
                <PostsTooltip postId={dialogue.postId}><Link to={postGetEditUrl(dialogue.postId)}> {truncate(dialogue.title, 30)} </Link></PostsTooltip> 
              </div>
             </div>
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
