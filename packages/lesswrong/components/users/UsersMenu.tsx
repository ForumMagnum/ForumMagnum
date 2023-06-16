import React, { useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanCreateField, userCanDo } from '../../lib/vulcan-users/permissions';
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { userHasThemePicker } from '../../lib/betas';

import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
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
    color: isEAForum ? undefined : theme.palette.grey[500]
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

  const {
    LWPopper, LWTooltip, ThemePickerMenu, DropdownMenu, DropdownItem, DropdownDivider,
  } = Components;
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
          <DropdownMenu>
            <div onClick={(ev) => {
              if (afNonMemberDisplayInitialPopup(currentUser, openDialog)) {
                ev.preventDefault()
              }
            }}>
              {userCanPost(currentUser) &&
                <DropdownItem
                  title={preferredHeadingCase("New Question")}
                  to="/newPost?question=true"
                />
              }
              {userCanPost(currentUser) &&
                <DropdownItem
                  title={preferredHeadingCase("New Post")}
                  to="/newPost"
                />
              }
              {userCanPost(currentUser) &&
                  !isEAForum &&
                  userCanCreateField(currentUser, postSchema['debate']) &&
                <DropdownItem
                  title={preferredHeadingCase("New Dialogue")}
                  to="/newpost?debate=true"
                />
              }
            </div>
            {showNewButtons && !currentUser.allCommentingDisabled &&
              <DropdownItem
                title={preferredHeadingCase("New Shortform")}
                onClick={() => openDialog({componentName:"NewShortformDialog"})}
              />
            }
            {showNewButtons && <DropdownDivider />}
            {showNewButtons && userCanPost(currentUser) &&
              <DropdownItem
                title={preferredHeadingCase("New Event")}
                to="/newPost?eventForm=true"
              />
            }
            {showNewButtons && currentUser.karma >= 1000 &&
              <DropdownItem
                title={preferredHeadingCase("New Sequence")}
                to="/sequencesnew"
              />
            }

            <DropdownDivider />

            {forumTypeSetting.get() === 'AlignmentForum' && !isAfMember &&
              <DropdownItem
                title={preferredHeadingCase("Apply for Membership")}
                onClick={() => openDialog({componentName: "AFApplicationForm"})}
              />
            }
            {currentUser.noKibitz &&
              <DropdownItem
                title={preferredHeadingCase(
                  disableNoKibitz
                    ? "Hide Names"
                    : "Reveal Names"
                )}
                onClick={() => setDisableNoKibitz(!disableNoKibitz)}
                icon={() => disableNoKibitz
                  ? <EyeIcon className={classes.icon} />
                  : <EyeIconCrossed className={classes.icon} />
                }
              />
            }
            {!isEAForum &&
              <DropdownItem
                title={preferredHeadingCase("My Drafts")}
                to="/drafts"
                icon="Edit"
                iconClassName={classes.icon}
              />
            }
            {!currentUser.deleted &&
              <DropdownItem
                title={preferredHeadingCase("User Profile")}
                to={`/users/${currentUser.slug}`}
                icon="User"
                iconClassName={classes.icon}
              />
            }
            {userHasThemePicker(currentUser) &&
              <ThemePickerMenu>
                <DropdownItem
                  title="Theme"
                  onClick={() => {}}
                  icon="Puzzle"
                  iconClassName={classes.icon}
                />
              </ThemePickerMenu>
            }
            <DropdownItem
              title={preferredHeadingCase("Account Settings")}
              to="/account"
              icon="Settings"
              iconClassName={classes.icon}
            />
            <DropdownItem
              title={preferredHeadingCase("Private Messages")}
              to="/inbox"
              icon="Email"
              iconClassName={classes.icon}
            />
            {currentUser.bookmarkedPostsMetadata?.length > 0 &&
              <DropdownItem
                title={isEAForum ? "Saved & read" : "Bookmarks"}
                to={isEAForum ? "/saved" : "/bookmarks"}
                icon="Bookmarks"
                iconClassName={classes.icon}
              />
            }
            {currentUser.shortformFeedId &&
              <DropdownItem
                title={preferredHeadingCase("Shortform Page")}
                to={postGetPageUrl({
                  _id: currentUser.shortformFeedId,
                  slug: "shortform",
                })}
                icon="Shortform"
                iconClassName={classes.icon}
              />
            }

            <DropdownDivider />

            <DropdownItem
              title={preferredHeadingCase("Log Out")}
              to="/logout"
              rawLink
            />
          </DropdownMenu>
        </Paper>
      </LWPopper>
    </div>
  );
}

const UsersMenuComponent = registerComponent('UsersMenu', UsersMenu, {styles});

declare global {
  interface ComponentTypes {
    UsersMenu: typeof UsersMenuComponent
  }
}
