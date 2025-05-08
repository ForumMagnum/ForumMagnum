import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from "../../lib/analyticsEvents";
import { ActiveDialogue, useOnServerSentEvent } from '../hooks/useUnreadNotifications';
import { useCurrentUser } from '../common/withUser';
import { postGetEditUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import classNames from 'classnames';
import VisibilityOff from '@/lib/vendor/@material-ui/icons/src/VisibilityOff';
import Visibility from '@/lib/vendor/@material-ui/icons/src/Visibility';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import isEqual from 'lodash/isEqual';
import { PostsTooltip } from "../posts/PostsPreviewTooltip/PostsTooltip";
import { Typography } from "../common/Typography";
import { UsersName } from "../users/UsersName";

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: "1%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  activeDot: {
    height: 8,
    width: 8,
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: 11,
    marginLeft: 15
  },
  collapsedDot: {
    marginRight: 8,
    marginLeft: 8
  },
  greenDot: {
    backgroundColor: theme.palette.secondary.light,
    boxShadow: `0 0 5px ${theme.palette.secondary.light}, 0 0 8px ${theme.palette.secondary.light}, 0 0 11px ${theme.palette.secondary.light}`,
  },
  orangeDot: {
    backgroundColor: theme.palette.icon.activeDotOrange,
    border: `1px solid ${theme.palette.icon.activeDotOrange}`,
    boxShadow: `0 0 5px ${theme.palette.icon.activeDotOrange}, 0 0 8px ${theme.palette.icon.activeDotOrange}`,
    opacity: 0.7
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
  },
  iconContainer: {
    display: "flex",
  },
  collapsdedIconContainer: {
    marginRight: 6
  },
  visibilityIcon: {
    color: theme.palette.grey[400],
    fontSize: "1.7em",
    cursor: "pointer",
    '&:hover': {
      opacity: 0.6
    }
  }
});


export const ActiveDialoguesInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const [activeDialogues, setActiveDialogues] = useState<ActiveDialogue[]>([]);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const [isExpanded, setIsExpanded] = useState<boolean>(!currentUser?.hideActiveDialogueUsers);
  const toggleExpanded = () => {
    if (currentUser) {
      void updateCurrentUser({
        hideActiveDialogueUsers: isExpanded,
      })
    }
    setIsExpanded(!isExpanded)
  }

  const location = useLocation();

  useOnServerSentEvent('activeDialoguePartners', currentUser, (message) => {
    if (currentUser?._id && message.data) {  
      const otherActiveDialogues = message.data.filter((dialogue) => !location.pathname.includes(dialogue.postId) && !(location.query.postId === dialogue.postId)) // don't show a dialogue as active on its own page
      setActiveDialogues((activeDialogues) =>
        isEqual(activeDialogues, otherActiveDialogues)
          ? activeDialogues : otherActiveDialogues
      );
    }
  });

  if (!currentUser || !activeDialogues) return null;

  const activeDialoguesWithoutSelf = activeDialogues.filter(d => d.userIds.length > 0)

  return (
    <div className={classes.root}>
      {activeDialoguesWithoutSelf.length > 0 && 
        <div className={classNames(classes.iconContainer, {
          [classes.collapsdedIconContainer]: !isExpanded,
        })} onClick={toggleExpanded}>
          {isExpanded ? 
            <VisibilityOff className={classes.visibilityIcon} /> : 
            <Visibility className={classes.visibilityIcon} />}
        </div>}
      {activeDialoguesWithoutSelf.map((dialogue) => (
        <div className={classes.activeDialogueContainer} key={dialogue.postId}>
          <div className={classNames(classes.activeDot, {
            [classes.greenDot]: dialogue.anyoneRecentlyActive,
            [classes.orangeDot]: !dialogue.anyoneRecentlyActive,
            [classes.collapsedDot]: !isExpanded,
            })
          }>
          </div>
          {isExpanded && <PostsTooltip postId={dialogue.postId}>
            <Link to={postGetEditUrl(dialogue.postId)} onClick={() => captureEvent("header dialogue clicked")}> 
              <div className={classes.dialogueDetailsContainer}> 
                <Typography variant='body2' className={classes.activeAuthorNames}> 
                  {
                    dialogue?.userIds
                      .map(id => <UsersName key={dialogue.postId} documentId={id} simple={true}></UsersName>)
                      .reduce((prev, curr, index) => {
                        return index === 0 ? [curr] : [...prev, ', ', curr]
                      }, [])
                  }
                </Typography> 
                <Typography variant='body2' className={classes.activeDialogueTitle}> 
                  {dialogue.title.length < 30 ? dialogue.title : dialogue.title.substring(0, 30)+"..." } 
                </Typography> 
              </div>
            </Link>
          </PostsTooltip>} 
        </div>
      ))}
    </div>
  );
}

export const ActiveDialogues = registerComponent('ActiveDialogues', ActiveDialoguesInner, {styles});

declare global {
  interface ComponentTypes {
    ActiveDialogues: typeof ActiveDialogues
  }
}
