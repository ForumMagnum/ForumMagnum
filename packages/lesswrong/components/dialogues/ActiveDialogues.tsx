import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ActiveDialogue, useOnNotificationsChanged } from '../hooks/useUnreadNotifications';
import { useCurrentUser } from '../common/withUser';
import { postGetEditUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: "1%",
    display: "flex",
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  activeDot: {
    height: 8,
    width: 8,
    backgroundColor: theme.palette.secondary.light,
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: `0 0 5px ${theme.palette.secondary.light}, 0 0 8px ${theme.palette.secondary.light}, 0 0 11px ${theme.palette.secondary.light}`,
    marginRight: 11,
    marginLeft: 15
  },
  activeAuthorNames: {
    color: theme.palette.header.text,
    fontSize: 16
  },
  activeDialogueTitle: {
    marginLeft: 5,
    color: theme.palette.text.dim3,
    fontSize: 16,
  },
  activeDialogueContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  dialogueDetailsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }
});


export const ActiveDialogues = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { PostsTooltip, Typography, UsersName } = Components

  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const [activeDialogues, setActiveDialogues] = useState<ActiveDialogue[]>([]);

  const currentUser = useCurrentUser();
  const location = useLocation();

  useOnNotificationsChanged(currentUser, (message) => {
    if (message.eventType === 'activeDialoguePartners' && currentUser?._id) {  
      const otherActiveDialogues = message.data.filter((dialogue) => !location.pathname.includes(dialogue.postId) && !(location.query.postId === dialogue.postId)) // don't show a dialogue as active on its own page
      setActiveDialogues(otherActiveDialogues);
    }
  });

  if (!currentUser) return null;

  return (
    <div className={classes.root}>
      {activeDialogues.map((dialogue) => (
        <div className={classes.activeDialogueContainer} key={dialogue.postId}>
          <div className={classes.activeDot}>
          </div>
          <PostsTooltip postId={dialogue.postId}>
            <Link to={postGetEditUrl(dialogue.postId)}> 
              <div className={classes.dialogueDetailsContainer}> 
                <Typography variant='body2' className={classes.activeAuthorNames}> 
                  {dialogue.userIds.filter(id => id !== currentUser._id).map(id => <UsersName key={dialogue.postId} documentId={id} simple={true}></UsersName>)} 
                </Typography> 
                <Typography variant='body2' className={classes.activeDialogueTitle}> 
                  {dialogue.title.length < 30 ? dialogue.title : dialogue.title.substring(0, 30)+"..." } 
                </Typography> 
              </div>
            </Link>
          </PostsTooltip> 
        </div>
      ))}
    </div>
  );
}

const ActiveDialoguesComponent = registerComponent('ActiveDialogues', ActiveDialogues, {styles});

declare global {
  interface ComponentTypes {
    ActiveDialogues: typeof ActiveDialoguesComponent
  }
}
