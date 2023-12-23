import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import ArchiveIcon from "@material-ui/icons/Archive";
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
    padding: 16,
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
  restoreButton: {
    background: theme.palette.buttons.alwaysPrimary,
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
const ArchiveNotice = ({post, classes}: {
  post: PostsPage, 
  classes: ClassesType
}) => {
  const { ContentStyles, Loading } = Components
  const [hidden, setHidden] = useState(false)
  const {flash} = useMessages();

  const {mutate: updatePost, loading, error} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsEdit',
  });

  const handleRestore = async () => {
    await updatePost({
      selector: {_id: post._id},
      data: {deletedDraft: false}
    })
    flash({
      messageString: "Restored", 
      type: "success", 
    })
  }

  if (loading) return <Loading />
  if (error) return <p>Error: {error.message}</p>

  return (
  <ContentStyles contentType="comment" className={classNames(classes.lwBanner, {[classes.hidden]: hidden})}>
    
      <div>
        <p className={classes.title}>This draft is archived</p>
          <p>It may either have been archived by a coauthor, or auto-archived due to inactivity.</p>
          <p className={classes.subtleText}>See all your archived drafts: <Link to={"/drafts?includeArchived=true"}>{"lesswrong.com/drafts"}</Link> 
        </p>
        <div className={classes.buttonRow}>
          <button className={classNames(classes.buttonShared, classes.restoreButton)} type="button" onClick={handleRestore}>
            Restore
          </button>
        </div>
      </div> 
    <IconButton className={classes.closeIcon} onClick={() => setHidden(true)}>
      <CloseIcon />
    </IconButton>
  </ContentStyles>)
}

const ArchiveNoticeComponent = registerComponent('ArchiveNotice', ArchiveNotice, {styles});

declare global {
  interface ComponentTypes {
    ArchiveNotice: typeof ArchiveNoticeComponent
  }
}
