import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, {useState} from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users/permissions';
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
import MenuItem from '@material-ui/core/MenuItem';
import ExtensionIcon from '@material-ui/icons/Extension';

import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog'
import { useHover } from '../common/withHover'
import { forumTypeSetting } from '../../lib/instanceSettings';

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
    fontWeight: 400,
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

const UsersMenu = ({color="rgba(0, 0, 0, 0.6)", classes}: {
  color?: string,
  classes: ClassesType
}) => {
  const [open,setOpen] = useState(false);
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, anchorEl} = useHover();
  const {openDialog} = useDialog();
  const { LWPopper, LWTooltip, ThemePickerMenu } = Components

  if (!currentUser) return null;

  const showNewButtons = (forumTypeSetting.get() !== 'AlignmentForum' || userCanDo(currentUser, 'posts.alignment.new')) && !currentUser.deleted
  const isAfMember = currentUser.groups && currentUser.groups.includes('alignmentForum')

  return (
      <div className={classes.root} {...eventHandlers}>
        <Link to={`/users/${currentUser.slug}`}>
          <Button classes={{root: classes.userButtonRoot}}>
            <span className={classes.userButtonContents} style={{ color: color }}>
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
            {showNewButtons &&
              <MenuItem onClick={()=>openDialog({componentName:"NewQuestionDialog"})}>
                New Question
              </MenuItem>
            }
            {showNewButtons && <Link to={`/newPost`}>
                <MenuItem>New Post</MenuItem>
              </Link>
            }
            {showNewButtons &&
              <MenuItem onClick={()=>openDialog({componentName:"NewShortformDialog"})}>
                New Shortform
              </MenuItem>
            }
            {showNewButtons && <Divider/>}
            {showNewButtons && <Link to={`/newPost?eventForm=true`}>
                <MenuItem>New Event</MenuItem>
              </Link>
            }
            {(showNewButtons && currentUser.karma >= 1000) &&
              <Link to={`/sequencesnew`}>
                <MenuItem>New Sequence</MenuItem>
              </Link>
            }
            {showNewButtons && <Divider/>}
            { forumTypeSetting.get() === 'AlignmentForum' && !isAfMember && <MenuItem onClick={() => openDialog({componentName: "AFApplicationForm"})}>
              Apply for Membership
            </MenuItem> }
            {!currentUser.deleted && <Link to={`/users/${currentUser.slug}`}>
              <MenuItem>
                <ListItemIcon>
                  <PersonIcon className={classes.icon}/>
                </ListItemIcon>
                User Profile
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
                Edit Settings
              </MenuItem>
            </Link>
            <Link to={`/inbox`}>
              <MenuItem>
                <ListItemIcon>
                  <EmailIcon className={classes.icon}/>
                </ListItemIcon>
                Private Messages
              </MenuItem>
            </Link>
            {(currentUser.bookmarkedPostsMetadata?.length > 0) && <Link to={`/bookmarks`}>
              <MenuItem>
                <ListItemIcon>
                  <BookmarksIcon className={classes.icon}/>
                </ListItemIcon>
                Bookmarks
              </MenuItem>
            </Link>}
            {currentUser.shortformFeedId &&
              <Link to={postGetPageUrl({_id:currentUser.shortformFeedId, slug: "shortform"})}>
                <MenuItem>
                  <ListItemIcon>
                    <NotesIcon className={classes.icon} />
                  </ListItemIcon>
                  Shortform Page
                </MenuItem>
              </Link>
            }
            <Divider/>
            <MenuItem component="a" href="/logout">
              Log Out
            </MenuItem>
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
