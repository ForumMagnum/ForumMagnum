import React, { MouseEvent, useContext } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo, userCanQuickTake, userIsMemberOf, userOverNKarmaOrApproved } from '../../lib/vulcan-users/permissions';
import { userGetAnalyticsUrl, userGetDisplayName, userGetProfileUrl, userCanPost } from '../../lib/collections/users/helpers';
import { dialoguesEnabled, userHasThemePicker } from '../../lib/betas';

import { Paper, Card }from '@/components/widgets/Paper';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import EyeIconCrossed from '@/lib/vendor/@material-ui/icons/src/VisibilityOff';
import EyeIcon from '@/lib/vendor/@material-ui/icons/src/Visibility';

import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog'
import { useHover } from '../common/withHover'
import {afNonMemberDisplayInitialPopup} from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { MINIMUM_COAUTHOR_KARMA } from "@/lib/collections/posts/helpers";
import { DisableNoKibitzContext } from './UsersNameDisplay';
import { useAdminToggle } from '../admin/useAdminToggle';
import { isFriendlyUI, preferredHeadingCase, styleSelect } from '../../themes/forumTheme';
import { isMobile } from '../../lib/utils/isMobile'
import { SHOW_NEW_SEQUENCE_KARMA_THRESHOLD } from '../../lib/collections/sequences/helpers';
import { isAF, isEAForum, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { blackBarTitle } from '../../lib/publicSettings';
import { tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { InteractionWrapper } from '../common/useClickableCell';
import NewDialogueDialog from "../posts/NewDialogueDialog";
import NewShortformDialog from "../shortform/NewShortformDialog";
import AFApplicationForm from "../alignment-forum/AFApplicationForm";
import LWPopper from "../common/LWPopper";
import LWTooltip from "../common/LWTooltip";
import ThemePickerMenu from "../themes/ThemePickerMenu";
import DropdownMenu from "../dropdowns/DropdownMenu";
import DropdownItem from "../dropdowns/DropdownItem";
import DropdownDivider from "../dropdowns/DropdownDivider";
import UsersProfileImage from "./UsersProfileImage";
import ForumIcon from "../common/ForumIcon";
import NewWikiTagMenu from "../tagging/NewWikiTagMenu";

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
  
  const profileNode =
    !currentUser.deleted &&
    (isFriendlyUI ? (
      <>
        <DropdownItem
          title={
            <div className={classes.profileHeader}>
              <UsersProfileImage user={currentUser} size={32} />
              <div className={classes.profileHeaderInfo}>{userGetDisplayName(currentUser)}</div>
            </div>
          }
          to={userGetProfileUrl(currentUser)}
        />
        <DropdownDivider />
      </>
    ) : (
      <DropdownItem
        title={preferredHeadingCase("User Profile")}
        to={userGetProfileUrl(currentUser)}
        icon="User"
        iconClassName={classes.icon}
      />
    ));
  const accountSettingsNode = <DropdownItem
    title={styleSelect({friendly: "Settings", default: preferredHeadingCase("Account Settings")})}
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
          title={styleSelect({friendly: "Post", default: preferredHeadingCase("New Post")})}
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
          title={styleSelect({friendly: "Dialogue", default: preferredHeadingCase("New Dialogue")})}
          onClick={() => openDialog({
            name:"NewDialogueDialog",
            contents: ({onClose}) => <NewDialogueDialog onClose={onClose}/>
          })}
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
            title={styleSelect({friendly: "Quick take", default: preferredHeadingCase("New Quick Take")})}
            onClick={() => openDialog({
              name:"NewShortformDialog",
              contents: ({onClose}) => <NewShortformDialog onClose={onClose}/>
            })}
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
          title={styleSelect({friendly: "Event", default: preferredHeadingCase("New Event")})}
          to="/newPost?eventForm=true"
        />
      )
      : null,
    newSequence: () =>
      showNewButtons && currentUser.karma >= SHOW_NEW_SEQUENCE_KARMA_THRESHOLD
        ? (
          <DropdownItem
            title={styleSelect({friendly: "Sequence", default: preferredHeadingCase("New Sequence")})}
            to="/sequencesnew"
          />
        )
        : null,
  } as const;

  const hasBookmarks = isEAForum || (currentUser?.bookmarkedPostsMetadata.length ?? 0) >= 1;

  const order: (keyof typeof items)[] = isFriendlyUI
    ? ["newPost", "newShortform", "divider", "newEvent", "newDialogue", "newSequence"]
    : ["newShortform", "newPost", "newWikitag", "newEvent"];

  const writeNewNode = isFriendlyUI ? (
    <InteractionWrapper>
      <LWTooltip
        title={
          <div className={classes.writeNewTooltip}>
            <Card>
              <DropdownMenu>
                <div onClick={forceUnHover}>
                  {order.map((itemName, i) => {
                    const Component = items[itemName];
                    return <Component key={i} />;
                  })}
                </div>
              </DropdownMenu>
            </Card>
          </div>
        }
        clickable
        tooltip={false}
        inlineBlock={false}
        placement="left-start"
      >
        <DropdownItem title="Write new" icon="PencilSquare" afterIcon="ThickChevronRight" />
      </LWTooltip>
    </InteractionWrapper>
  ) : (
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
  );

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
              {isFriendlyUI && profileNode}
              {writeNewNode}

              {!isFriendlyUI && <DropdownDivider />}

              {isAF && !isAfMember &&
                <DropdownItem
                  title={preferredHeadingCase("Apply for Membership")}
                  onClick={() => openDialog({
                    name: "AFApplicationForm",
                    contents: ({onClose}) => <AFApplicationForm onClose={onClose}/>
                  })}
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
              {!isFriendlyUI && profileNode}
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
              {hasBookmarks &&<DropdownItem
                title={styleSelect({friendly: "Saved & read", default: "Bookmarks"})}
                to={styleSelect({friendly: "/saved", default: "/bookmarks"})}
                icon={styleSelect({friendly: "BookmarkBorder", default: "Bookmarks"})}
                iconClassName={classes.icon}
              />}
              {isEAForum && <DropdownItem
                title={"Post stats"}
                to={userGetAnalyticsUrl(currentUser)}
                icon="BarChart"
                iconClassName={classes.icon}
              />}
              {accountSettingsNode}

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

export default registerComponent('UsersMenu', UsersMenu, {styles});


