import React, { MouseEvent, useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo, userCanQuickTake, userIsMemberOf, userOverNKarmaOrApproved } from '../../lib/vulcan-users/permissions';
import { userGetAnalyticsUrl, userGetDisplayName } from '../../lib/collections/users/helpers';
import { dialoguesEnabled, userHasThemePicker } from '../../lib/betas';
import EyeIconCrossed from '@material-ui/icons/VisibilityOff';
import EyeIcon from '@material-ui/icons/Visibility';

import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog'
import { useHover } from '../common/withHover'
import {afNonMemberDisplayInitialPopup} from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { userCanPost } from '../../lib/collections/posts/collection';
import { MINIMUM_COAUTHOR_KARMA } from '../../lib/collections/posts/schema';
import { DisableNoKibitzContext } from './UsersNameDisplay';
import { useAdminToggle } from '../admin/useAdminToggle';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { isMobile } from '../../lib/utils/isMobile'
import { SHOW_NEW_SEQUENCE_KARMA_THRESHOLD } from '../../lib/collections/sequences/permissions';
import { isAF, isEAForum, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { blackBarTitle } from '../../lib/publicSettings';
import { tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import LWPopper from "@/components/common/LWPopper";
import LWTooltip from "@/components/common/LWTooltip";
import ThemePickerMenu from "@/components/themes/ThemePickerMenu";
import DropdownMenu from "@/components/dropdowns/DropdownMenu";
import DropdownItem from "@/components/dropdowns/DropdownItem";
import DropdownDivider from "@/components/dropdowns/DropdownDivider";
import UsersProfileImage from "@/components/users/UsersProfileImage";
import ForumIcon from "@/components/common/ForumIcon";
import { NewWikiTagMenu } from "@/components/tagging/NewWikiTagMenu";
import { Paper, Button } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: isFriendlyUI ? undefined : 5,
    wordBreak: 'break-all',
    position: "relative"
  },
  userButtonRoot: {
    // Mui default is 16px, so we're halving it to bring it into line with the
    // rest of the header components
    paddingLeft: isFriendlyUI ? 12 : theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    borderRadius: isFriendlyUI ? theme.borderRadius.default : undefined
  },
  userButtonContents: {
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: isFriendlyUI ? undefined : 400,
    color: blackBarTitle.get() ? theme.palette.text.alwaysWhite : theme.palette.header.text,
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
    color: isFriendlyUI ? undefined : theme.palette.grey[500]
  },
  deactivatedTooltip: {
    maxWidth: 230
  },
  deactivated: {
    color: theme.palette.grey[600],
    marginLeft: 20
  },
  adminToggleItem: isFriendlyUI ? {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    }
  } : {},
})

const UsersMenu = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, forceUnHover, anchorEl} = useHover();
  const {openDialog} = useDialog();
  const {disableNoKibitz, setDisableNoKibitz} = useContext(DisableNoKibitzContext );
  const {toggleOn, toggleOff} = useAdminToggle();

  if (!currentUser) return null;
  if (currentUser.usernameUnset) {
    return <div className={classes.root}>
      <Button href='/logout' classes={{root: classes.userButtonRoot}}>
        <span className={classes.userButtonContents}>
          {isFriendlyUI ? "Log out" : "LOG OUT"}
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
  // On the EA Forum, if the user isn't deactivated, we instead show their profile image and a little arrow.
  if (isFriendlyUI && !currentUser.deleted) {
    userButtonNode = <div className={classes.userImageButton}>
      <UsersProfileImage user={currentUser} size={32} />
      <ForumIcon icon="ThickChevronDown" className={classes.arrowIcon} />
    </div>
  }
  
  /** Prevent navigation to your profile on mobile, where the only way to open
   * the menu is to click the button */
  const menuButtonOnClick = (ev: MouseEvent) => {
    if (isMobile()) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }
  
  const accountSettingsNode = <DropdownItem
    title={preferredHeadingCase("Account Settings")}
    to="/account"
    icon="Settings"
    iconClassName={classes.icon}
  />
  const messagesNode = <DropdownItem
    title={preferredHeadingCase("Private Messages")}
    to="/inbox"
    icon="Email"
    iconClassName={classes.icon}
  />
  
  const canCreateDialogue = userCanPost(currentUser)
    && dialoguesEnabled
    && userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)(currentUser)

  const items = {
    divider: DropdownDivider,
    newPost: () => userCanPost(currentUser)
      ? (
        <DropdownItem
          title={preferredHeadingCase("New Post")}
          to="/newPost"
        />
      )
      : null,
    newQuestion: () => userCanPost(currentUser)
      ? (
        <DropdownItem
          title={preferredHeadingCase("New Question")}
          to="/newPost?question=true"
        />
      )
      : null,
    newDialogue: () => canCreateDialogue
      ? (
        <DropdownItem
          title={preferredHeadingCase("New Dialogue")}
          onClick={() => openDialog({componentName:"NewDialogueDialog"})}
        />
      )
    : null,
    /*
      * This is currently disabled for unreviewed users
      * as there's issues with the new quick takes entry for such users.
      * Long-term, we should fix these issues and reenable this option.
      */
    newShortform: () =>
      showNewButtons && userCanQuickTake(currentUser)
        ? (
          <DropdownItem
            title={preferredHeadingCase("New Quick Take")}
            onClick={() => openDialog({componentName:"NewShortformDialog"})}
          />
        )
      : null,
    newWikitag: () => tagUserHasSufficientKarma(currentUser, "new") ? (
      <NewWikiTagMenu>
        <DropdownItem
          title={preferredHeadingCase(`New ${taggingNameCapitalSetting.get()}`)}
        />
      </NewWikiTagMenu>
    ) : null,
    newEvent: () => userCanPost(currentUser)
      ? (
        <DropdownItem
          title={preferredHeadingCase("New Event")}
          to="/newPost?eventForm=true"
        />
      )
      : null,
    newSequence: () =>
      showNewButtons && currentUser.karma >= SHOW_NEW_SEQUENCE_KARMA_THRESHOLD
        ? (
          <DropdownItem
            title={preferredHeadingCase("New Sequence")}
            to="/sequencesnew"
          />
        )
        : null,
  } as const;

  const hasBookmarks = (currentUser?.bookmarkedPostsMetadata.length ?? 0) >= 1;

  const order: (keyof typeof items)[] = isFriendlyUI
    ? ["newPost", "newShortform", "newQuestion", "newDialogue", "divider", "newEvent", "newSequence"]
    : ["newShortform", "newPost", "newWikitag", "newEvent"];

  return (
    <div className={classes.root} {...eventHandlers}>
      <Link to={`/users/${currentUser.slug}`}>
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
                {order.map((itemName, i) => {
                  const Component = items[itemName];
                  return <Component key={i} />
                })}
              </div>

              <DropdownDivider />

              {isAF && !isAfMember &&
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
              {!currentUser.deleted &&
                <DropdownItem
                  title={preferredHeadingCase("User Profile")}
                  to={`/users/${currentUser.slug}`}
                  icon="User"
                  iconClassName={classes.icon}
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
              {!isFriendlyUI && messagesNode}
              {userHasThemePicker(currentUser) &&
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
              }
              {isEAForum && <DropdownItem
                title={"Post stats"}
                to={userGetAnalyticsUrl(currentUser)}
                icon="BarChart"
                iconClassName={classes.icon}
              />}
              {hasBookmarks &&<DropdownItem
                title={isFriendlyUI ? "Saved & read" : "Bookmarks"}
                to={isFriendlyUI ? "/saved" : "/bookmarks"}
                icon="Bookmarks"
                iconClassName={classes.icon}
              />}
              {!isFriendlyUI && accountSettingsNode}
              {isFriendlyUI && currentUser.shortformFeedId &&
                <DropdownItem
                  // TODO: get Habryka's take on what the title here should be
                  title={preferredHeadingCase("Your Quick Takes")}
                  to={postGetPageUrl({
                    _id: currentUser.shortformFeedId,
                    slug: "shortform",
                  })}
                  icon={isFriendlyUI ? "CommentFilled" : "Shortform"}
                  iconClassName={classes.icon}
                />
              }
              {isFriendlyUI && accountSettingsNode}
  
              {/*
                If you're an admin, you can disable your admin + moderator
                powers and take them back.
              */}
              {currentUser.isAdmin && <div className={classes.adminToggleItem}>
                <DropdownItem
                  title={preferredHeadingCase("Disable Admin Powers")}
                  onClick={toggleOff}
                />
              </div>}
              {!currentUser.isAdmin && userIsMemberOf(currentUser, "realAdmins") && <div className={classes.adminToggleItem}>
                <DropdownItem
                  title={preferredHeadingCase("Re-enable Admin Powers")}
                  onClick={toggleOn}
                />
              </div>}
  
              <DropdownDivider />
              
              <DropdownItem
                title={preferredHeadingCase("Log Out")}
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

const UsersMenuComponent = registerComponent('UsersMenu', UsersMenu, {styles});

declare global {
  interface ComponentTypes {
    UsersMenu: typeof UsersMenuComponent
  }
}

export default UsersMenuComponent;
