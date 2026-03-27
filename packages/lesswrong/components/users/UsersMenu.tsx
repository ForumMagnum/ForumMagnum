import React, { MouseEvent, useContext } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo, userCanQuickTake, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { userGetDisplayName, userGetProfileUrl, userCanPost } from '../../lib/collections/users/helpers';

import { Paper, Card }from '@/components/widgets/Paper';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import EyeIconCrossed from '@/lib/vendor/@material-ui/icons/src/VisibilityOff';
import EyeIcon from '@/lib/vendor/@material-ui/icons/src/Visibility';

import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog'
import { useHover } from '../common/withHover'
import {afNonMemberDisplayInitialPopup} from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { DisableNoKibitzContext } from '../common/sharedContexts';
import { useAdminToggle } from '../admin/useAdminToggle';
import { isMobile } from '../../lib/utils/isMobile'
import { blackBarTitle } from '@/lib/instanceSettings';
import { tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import LWPopper from "../common/LWPopper";
import LWTooltip from "../common/LWTooltip";
import ThemePickerMenu from "../themes/ThemePickerMenu";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import DropdownDivider from "../dropdowns/DropdownDivider";
import NewWikiTagMenu from "../tagging/NewWikiTagMenu";
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/styles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';

import dynamic from 'next/dynamic';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useForumType } from '../hooks/useForumType';

const NewDialogueDialog = dynamic(() => import("../posts/NewDialogueDialog"), { ssr: false });
const NewShortformDialog = dynamic(() => import("../shortform/NewShortformDialog"), { ssr: false });
const AFApplicationForm = dynamic(() => import("../alignment-forum/AFApplicationForm"), { ssr: false });

const styles = defineStyles('UsersMenu', (theme: ThemeType) => ({
  root: {
    marginTop: 5,
    wordBreak: 'break-all',
    position: "relative"
  },
  userButtonRoot: {
    // Mui default is 16px, so we're halving it to bring it into line with the
    // rest of the header components
    paddingLeft: 8,
    paddingRight: 8,
  },
  userButtonContents: {
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 400,
    color: isBlackBarTitle ? theme.palette.text.alwaysWhite : theme.palette.header.text,
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdOverlay,
    }),
    wordBreak: 'break-word'
  },
  userImageButton: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 4
  },
  arrowIcon: {
    color: theme.palette.grey[600],
    fontSize: 18
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
  },
  adminToggleItem: {},
  writeNewTooltip: {
    padding: "0 15px",
    minWidth: 180
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "4px 0",
    minWidth: 180,
    maxWidth: 220
  },
  profileHeaderInfo: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
}))

const UsersMenu = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { isAF } = useForumType();
  const {eventHandlers, hover, forceUnHover, anchorEl} = useHover();
  const {openDialog} = useDialog();
  const {disableNoKibitz, setDisableNoKibitz} = useContext(DisableNoKibitzContext );
  const {toggleOn, toggleOff} = useAdminToggle();

  if (!currentUser) return null;
  if (currentUser.usernameUnset) {
    return <div className={classes.root}>
      <Button href='/logout' classes={{root: classes.userButtonRoot}}>
        <span className={classes.userButtonContents}>
          {"LOG OUT"}
        </span>
      </Button>
    </div>
  }
  
  const showNewButtons = (!isAF || userCanDo(currentUser, 'posts.alignment.new')) && !currentUser.deleted
  const isAfMember = currentUser.groups && currentUser.groups.includes('alignmentForum')
  // By default, we show the user's display name as the menu button.
  let userButtonNode = <span className={classes.userButtonContents}>
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
    {isAF && !isAfMember && <span className={classes.notAMember}> (Not a Member) </span>}
  </span>
  
  /** Prevent navigation to your profile on mobile, where the only way to open
   * the menu is to click the button */
  const menuButtonOnClick = (ev: MouseEvent) => {
    if (isMobile()) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }
  
  const hasBookmarks = currentUser?.hasAnyBookmarks;

  return (
    <div className={classes.root} {...eventHandlers}>
      <Link to={userGetProfileUrl(currentUser)}>
        <Button
          classes={{root: classes.userButtonRoot}}
          onClick={menuButtonOnClick}
          data-testid="users-menu"
        >
          {userButtonNode}
        </Button>
      </Link>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="bottom-start"
      >
        <Paper>
          <DropdownMenu>
            <div
              onClick={() => {
                forceUnHover();
              }}
            >
              <div onClick={(ev) => {
                if (afNonMemberDisplayInitialPopup(currentUser, openDialog)) {
                  ev.preventDefault()
                }
              }}>
                {/*
                  * Creating Quick Takes is currently disabled for unreviewed users
                  * as there's issues with the new quick takes entry for such users.
                  * Long-term, we should fix these issues and reenable this option.
                  */}
                {(showNewButtons && userCanQuickTake(currentUser)) ? <DropdownItem
                  title="New Quick Take"
                  onClick={() => {
                    openDialog({
                      name:"NewShortformDialog",
                      contents: ({onClose}) => <NewShortformDialog onClose={onClose}/>
                    });
                  }}
                /> : null}

                {userCanPost(currentUser) ? <DropdownItem
                  title="New Post"
                  to="/newPost"
                /> : null}

                {tagUserHasSufficientKarma(currentUser, "new") ? (
                  <NewWikiTagMenu>
                    <DropdownItem
                      title={`New Wikitag`}
                    />
                  </NewWikiTagMenu>
                ) : null}

                {userCanPost(currentUser) ? <DropdownItem
                  title="New Event"
                  to="/newPost?eventForm=true"
                /> : null}
              </div>

              <DropdownDivider />

              {isAF && !isAfMember &&
                <DropdownItem
                  title={"Apply for Membership"}
                  onClick={() => {
                    openDialog({
                      name: "AFApplicationForm",
                      contents: ({onClose}) => <AFApplicationForm onClose={onClose}/>
                    })
                  }}
                />
              }
              {currentUser.noKibitz &&
                <DropdownItem
                  title={disableNoKibitz
                    ? "Hide Names"
                    : "Reveal Names"
                  }
                  onClick={() => setDisableNoKibitz(!disableNoKibitz)}
                  icon={() => disableNoKibitz
                    ? <EyeIcon className={classes.icon} />
                    : <EyeIconCrossed className={classes.icon} />
                  }
                />
              }

              {!currentUser.deleted && <DropdownItem
                title={"User Profile"}
                to={userGetProfileUrl(currentUser)}
                icon="User"
                iconClassName={classes.icon}
              />}
              <DropdownItem
                title={"My Drafts"}
                to="/drafts"
                icon="Edit"
                iconClassName={classes.icon}
              />
              <DropdownItem
                title={"Private Messages"}
                to="/inbox"
                icon="Email"
                iconClassName={classes.icon}
              />
              <ThemePickerMenu>
                <DropdownItem
                  title="Theme"
                  onClick={(ev) => {
                    if (isMobile()) {
                      ev.stopPropagation();
                    }
                  }}
                  icon="Puzzle"
                  iconClassName={classes.icon}
                />
              </ThemePickerMenu>
              {hasBookmarks &&<DropdownItem
                title={"Saved & Read"}
                to="/bookmarks"
                icon={"Bookmarks"}
                iconClassName={classes.icon}
              />}
              <DropdownItem
                title="Account Settings"
                to="/account"
                icon="Settings"
                iconClassName={classes.icon}
              />

              {currentUser.isAdmin && <DropdownItem
                title="Admin pages"
                to="/admin"
              />}

              {/*
                If you're an admin, you can disable your admin + moderator
                powers and take them back.
              */}
              {currentUser.isAdmin && <div className={classes.adminToggleItem}>
                <DropdownItem
                  title={"Disable Admin Powers"}
                  onClick={toggleOff}
                />
              </div>}
              {!currentUser.isAdmin && userIsMemberOf(currentUser, "realAdmins") && <div className={classes.adminToggleItem}>
                <DropdownItem
                  title={"Re-enable Admin Powers"}
                  onClick={toggleOn}
                />
              </div>}

              <DropdownDivider />

              <DropdownItem
                title={"Log Out"}
                to="/logout"
                rawLink
              />
            </div>
          </DropdownMenu>
        </Paper>
      </LWPopper>
    </div>
  );
}

export default UsersMenu;
