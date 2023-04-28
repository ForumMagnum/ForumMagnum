import React, { useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanCreateField, userCanDo, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { userHasThemePicker } from '../../lib/betas';

import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import SettingsButton from '@material-ui/icons/Settings';
import EmailIcon from '@material-ui/icons/Email';
import NotesIcon from '@material-ui/icons/Notes';
import PersonIcon from '@material-ui/icons/Person';
import BookmarksIcon from '@material-ui/icons/Bookmarks';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit'
import ExtensionIcon from '@material-ui/icons/Extension';
import EyeIconCrossed from '@material-ui/icons/VisibilityOff';
import EyeIcon from '@material-ui/icons/Visibility';

import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog'
import { useHover } from '../common/withHover'
import { forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import {afNonMemberDisplayInitialPopup} from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { userCanPost } from '../../lib/collections/posts';
import postSchema from '../../lib/collections/posts/schema';
import { DisableNoKibitzContext } from './UsersNameDisplay';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 5,
    wordBreak: 'break-all',
    position: "relative"
  },
  userButtonRoot: {
    // Mui default is 16px, so we're halving it to bring it into line with the
    // rest of the header components
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit
  },
  userButtonContents: {
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: isEAForum ? undefined : 400,
    color: theme.palette.header.text,
    wordBreak: 'break-word',
    ...(isEAForum && {
      lineHeight: '18px',
      display: '-webkit-box',
      "-webkit-box-orient": "vertical",
      "-webkit-line-clamp": 2,
      overflow: 'hidden'
    })
  },
  notAMember: {
    marginLeft: 5,
    opacity: 0.9
  },
  icon: {
    color: theme.palette.grey[500]
  },
  deactivatedTooltip: {
    maxWidth: 230
  },
  deactivated: {
    color: theme.palette.grey[600],
    marginLeft: 20
  }
})

const UsersMenu = ({classes}: {
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, anchorEl} = useHover();
  const {openDialog} = useDialog();
  const {disableNoKibitz, setDisableNoKibitz} = useContext(DisableNoKibitzContext );
  const { LWPopper, LWTooltip, ThemePickerMenu, MenuItem } = Components

  if (!currentUser) return null;
  if (currentUser.usernameUnset) {
    return <div className={classes.root}>
      <Button href='/logout' classes={{root: classes.userButtonRoot}}>
        <span className={classes.userButtonContents}>
          {isEAForum ? "Log out" : "LOG OUT"}
        </span>
      </Button>
    </div>
  }

  const showNewButtons = (forumTypeSetting.get() !== 'AlignmentForum' || userCanDo(currentUser, 'posts.alignment.new')) && !currentUser.deleted
  const isAfMember = currentUser.groups && currentUser.groups.includes('alignmentForum')

  return (
      <div className={classes.root} {...eventHandlers}>
        <Link to={`/users/${currentUser.slug}`}>
          <Button classes={{root: classes.userButtonRoot}}>
            <span className={classes.userButtonContents}>
              {userGetDisplayName(currentUser)}
              {currentUser.deleted && <LWTooltip title={<div className={classes.deactivatedTooltip}>
                <div>Your account has been deactivated:</div>
                <ul>
                  <li>Your username appears as '[Anonymous]' on comments/posts</li>
                  <li>Your profile page is not accessible</li>
                </ul>
              </div>}>
                <span className={classes.deactivated}>[Deactivated]</span>
              </LWTooltip>}
              {forumTypeSetting.get() === 'AlignmentForum' && !isAfMember && <span className={classes.notAMember}> (Not a Member) </span>}
            </span>
          </Button>
        </Link>
        <LWPopper
          open={hover}
          anchorEl={anchorEl}
          placement="bottom-start"
        >
          <Paper>
            <div onClick={(ev) => {
              if (afNonMemberDisplayInitialPopup(currentUser, openDialog)) {
                ev.preventDefault()
              }
            }}>
              {userCanPost(currentUser) && <Link to={`/newPost?question=true`}>
                <MenuItem>New Question</MenuItem>
              </Link>}
              {userCanPost(currentUser) && <Link to={`/newPost`}>
                <MenuItem>New Post</MenuItem>
              </Link>}
              {userCanPost(currentUser) && !isEAForum && userCanCreateField(currentUser, postSchema['debate']) && <Link to={`/newPost?debate=true`}>
                <MenuItem>New Dialogue</MenuItem>
              </Link>}
            </div>
            {showNewButtons && !currentUser.allCommentingDisabled && <MenuItem onClick={()=>openDialog({componentName:"NewShortformDialog"})}>
               New Shortform
            </MenuItem> }
            {showNewButtons && <Divider/>}
            {showNewButtons && userCanPost(currentUser) && 
              <Link to={`/newPost?eventForm=true`}>
                <MenuItem>New Event</MenuItem>
              </Link>
            }
            {(showNewButtons && currentUser.karma >= 1000) &&
              <Link to={`/sequencesnew`}>
                <MenuItem>New Sequence</MenuItem>
              </Link>
            }
            <Divider/>
            { forumTypeSetting.get() === 'AlignmentForum' && !isAfMember && <MenuItem onClick={() => openDialog({componentName: "AFApplicationForm"})}>
              {preferredHeadingCase("Apply for Membership")}
            </MenuItem> }
            {currentUser.noKibitz && <div>
              <MenuItem onClick={() => {
                setDisableNoKibitz(!disableNoKibitz);
              }}>
                <ListItemIcon>
                  {disableNoKibitz
                    ? <EyeIcon className={classes.icon}/>
                    : <EyeIconCrossed className={classes.icon}/>
                  }
                </ListItemIcon>
                {disableNoKibitz
                  ? "Hide Names"
                  : "Reveal Names"
                }
              </MenuItem>
            </div>}
            {!isEAForum && <Link to={'/drafts'}>
              <MenuItem>
                <ListItemIcon>
                  <EditIcon className={classes.icon}/>
                </ListItemIcon>
                My Drafts
              </MenuItem>
            </Link>}
            {!currentUser.deleted && <Link to={`/users/${currentUser.slug}`}>
              <MenuItem>
                <ListItemIcon>
                  <PersonIcon className={classes.icon}/>
                </ListItemIcon>
                {preferredHeadingCase("User Profile")}
              </MenuItem>
            </Link>}
            {userHasThemePicker(currentUser) && <ThemePickerMenu>
              <MenuItem>
                <ListItemIcon>
                  <ExtensionIcon className={classes.icon}/>
                </ListItemIcon>
                  Theme
              </MenuItem>
            </ThemePickerMenu>}
            <Link to={`/account`}>
              <MenuItem>
                <ListItemIcon>
                  <SettingsButton className={classes.icon}/>
                </ListItemIcon>
                {preferredHeadingCase("Account Settings")}
              </MenuItem>
            </Link>
            <Link to={`/inbox`}>
              <MenuItem>
                <ListItemIcon>
                  <EmailIcon className={classes.icon}/>
                </ListItemIcon>
                {preferredHeadingCase("Private Messages")}
              </MenuItem>
            </Link>
            {(currentUser.bookmarkedPostsMetadata?.length > 0) && <Link to={`/bookmarks`}>
              <MenuItem>
                <ListItemIcon>
                  <BookmarksIcon className={classes.icon}/>
                </ListItemIcon>
                {isEAForum ? "Saved posts" : "Bookmarks"}
              </MenuItem>
            </Link>}
            {currentUser.shortformFeedId &&
              <Link to={postGetPageUrl({_id:currentUser.shortformFeedId, slug: "shortform"})}>
                <MenuItem>
                  <ListItemIcon>
                    <NotesIcon className={classes.icon} />
                  </ListItemIcon>
                  {preferredHeadingCase("Shortform Page")}
                </MenuItem>
              </Link>
            }
            <Divider/>
            <a href="/logout">
              <MenuItem>
                {preferredHeadingCase("Log Out")}
              </MenuItem>
            </a>
          </Paper>
        </LWPopper>
    </div>
  )
}

const UsersMenuComponent = registerComponent('UsersMenu', UsersMenu, {styles});

declare global {
  interface ComponentTypes {
    UsersMenu: typeof UsersMenuComponent
  }
}
