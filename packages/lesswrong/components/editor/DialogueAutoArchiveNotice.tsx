import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import { isEAForum } from '../../lib/instanceSettings';
import AlarmIcon from '@material-ui/icons/Alarm';
import { isFriendlyUI } from '../../themes/forumTheme';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import {useUpdate} from '../../lib/crud/withUpdate';
import {useLocation} from '../../lib/routeUtil';
import {useCurrentUser} from '../common/withUser';
import {userGetProfileUrl} from '../../lib/collections/users/helpers';
import {useMessages} from '../common/withMessages';


const styles = (theme: ThemeType): JssStyles => ({
  lwBanner: {
    padding: 12,
    backgroundColor: theme.palette.background.warningTranslucent,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "60px",
  },
  hidden: {
    display: "none"
  },
  title: {
    fontWeight: 670,
  },
  icon: {
    marginLeft: 8,
    marginRight: 16,
    height: 24,
    color: theme.palette.grey[500]
  },
  buttonRow: {
    display: 'flex',
    displayDirection: 'row',
    alignItems: 'center',
  },
  buttonShared: {
    ...theme.typography.commentStyle,
     height: '36px',
     paddingLeft: 16,
     paddingRight: 16,
     marginRight: 10,
     color: 'white',
     fontSize: '14px',
     border: 0,
     fontWeight: '500',
     cursor: 'pointer',
     letterSpacing: '0.6',
     borderRadius: '6px',
     transition: 'all 0.2s ease',
     boxShadow: '0px 4px 5.5px 0px rgba(0, 0, 0, 0.07)',
     '&:hover': {
       opacity: 0.8
     },
  },
  okayButton: {
    background: theme.palette.buttons.alwaysPrimary,
  },
  archiveButton: {
    background: "none",
    color: theme.palette.text.primary,
    border: theme.palette.border.grey300,
  },
  closeIcon: { 
    color: theme.palette.grey[500],
    opacity: 0.5,
    padding: 2,
  },
  subtleText: {
    color: theme.palette.text.dim3,
  }
});

// Tells the user when they can next comment or post if they're rate limited, and a brief explanation
const DialogueAutoArchiveNotice = ({dialogue, daysLeft, classes}: {
  dialogue: PostsPage, 
  daysLeft: number,
  classes: ClassesType
}) => {
  const { ContentStyles, Loading } = Components
  const [hidden, setHidden] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  const {flash} = useMessages();
  const currentUser = useCurrentUser();

  const {mutate: updatePost, loading, error} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsEdit',
  });

  const handleArchive = async () => {
    await updatePost({
      selector: {_id: dialogue._id},
      data: {deletedDraft: true}
    })
    const postUrl = location.location
    const profileUrl = userGetProfileUrl(currentUser)
    navigate(profileUrl)
    flash({
      messageString: "Dialogue archived", 
      type: "success", 
      action: () => { // Undo action
          void updatePost({
            selector: {_id: dialogue._id},
            data: {deletedDraft: false}
          })
          navigate(postUrl)
          flash({messageString: "Restoring... It's okay to change your mind :)", type: "success"})
      }
    })
  }

  if (loading) return <Loading />
  if (error) return <p>Error: {error.message}</p>

  return (
  <ContentStyles contentType="comment" className={classNames(classes.lwBanner, {[classes.hidden]: hidden})}>
    <AlarmIcon className={classes.icon} />

    <div>
      <p className={classes.title}>This dialogue will auto-archive in {daysLeft} days, unless there are new edits</p>
        <p>To keep your drafts orderly, we archive dialogues without activity. To cancel archiving, just make any edit below.</p>
        <p className={classes.subtleText}>See all your drafts, including archived: <Link to={"/drafts?includeArchived=true"}>{"lesswrong.com/drafts"}</Link> 
      </p>
      <div className={classes.buttonRow}>
        <button className={classNames(classes.buttonShared, classes.okayButton)} type="button" onClick={() => setHidden(true)}>
          Okay
        </button>
        <button className={classNames(classes.buttonShared, classes.archiveButton)} type="button" onClick={handleArchive}>
          Archive now
        </button>
      </div>
    </div>  
    
    <IconButton className={classes.closeIcon} onClick={() => setHidden(true)}>
      <CloseIcon />
    </IconButton>
  </ContentStyles>)
}

const DialogueAutoArchiveNoticeComponent = registerComponent('DialogueAutoArchiveNotice', DialogueAutoArchiveNotice, {styles});

declare global {
  interface ComponentTypes {
    DialogueAutoArchiveNotice: typeof DialogueAutoArchiveNoticeComponent
  }
}
