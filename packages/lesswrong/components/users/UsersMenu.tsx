import { MouseEvent, useContext } from 'react';
import { dialoguesEnabled, userHasThemePicker } from '../../lib/betas';
import { userCanPost, userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userCanDo, userCanQuickTake, userIsMemberOf, userOverNKarmaOrApproved } from '../../lib/vulcan-users/permissions';

import { Paper } from '@/components/widgets/Paper';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import EyeIcon from '@/lib/vendor/@material-ui/icons/src/Visibility';
import EyeIconCrossed from '@/lib/vendor/@material-ui/icons/src/VisibilityOff';

import { MINIMUM_COAUTHOR_KARMA } from "@/lib/collections/posts/helpers";
import { isAF, taggingNameCapitalSetting } from '@/lib/instanceSettings';
import { afNonMemberDisplayInitialPopup } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { SHOW_NEW_SEQUENCE_KARMA_THRESHOLD } from '../../lib/collections/sequences/helpers';
import { tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { isMobile } from '../../lib/utils/isMobile';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { useAdminToggle } from '../admin/useAdminToggle';
import LWPopper from "../common/LWPopper";
import LWTooltip from "../common/LWTooltip";
import { DisableNoKibitzContext } from '../common/sharedContexts';
import { useDialog } from '../common/withDialog';
import { useHover } from '../common/withHover';
import { useCurrentUser } from '../common/withUser';
import DropdownDivider from "../dropdowns/DropdownDivider";
import DropdownItem from "../dropdowns/DropdownItem";
import DropdownMenu from "../dropdowns/DropdownMenu";
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/styles';
import NewWikiTagMenu from "../tagging/NewWikiTagMenu";
import ThemePickerMenu from "../themes/ThemePickerMenu";

import dynamic from 'next/dynamic';
const NewDialogueDialog = dynamic(() => import("../posts/NewDialogueDialog"), { ssr: false });
const NewShortformDialog = dynamic(() => import("../shortform/NewShortformDialog"), { ssr: false });
const AFApplicationForm = dynamic(() => import("../alignment-forum/AFApplicationForm"), { ssr: false });

const styles = (theme: ThemeType) => ({
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
          {"LOG OUT"}
        </span>
      </Button>
    </div>
  }
  
  const showNewButtons = (!isAF() || userCanDo(currentUser, 'posts.alignment.new')) && !currentUser.deleted
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
    {isAF() && !isAfMember && <span className={classes.notAMember}> (Not a Member) </span>}
  </span>
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
    ((
            <DropdownItem
              title={preferredHeadingCase("User Profile")}
              to={userGetProfileUrl(currentUser)}
              icon="User"
              iconClassName={classes.icon}
            />
          ));
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
    && dialoguesEnabled()
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
          onClick={() => {
            openDialog({
              name:"NewDialogueDialog",
              contents: ({onClose}) => <NewDialogueDialog onClose={onClose}/>
            })}
          }
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
            onClick={() => {
              openDialog({
                name:"NewShortformDialog",
                contents: ({onClose}) => <NewShortformDialog onClose={onClose}/>
              });
            }}
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

  const hasBookmarks = currentUser?.hasAnyBookmarks;

  const order: (keyof typeof items)[] = ["newShortform", "newPost", "newWikitag", "newEvent"];

  const writeNewNode = (
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
              {false}
              {writeNewNode}

              {<DropdownDivider />}

              {isAF() && !isAfMember &&
                <DropdownItem
                  title={preferredHeadingCase("Apply for Membership")}
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
              {profileNode}
              {<DropdownItem
                                            title={preferredHeadingCase("My Drafts")}
                                            to="/drafts"
                                            icon="Edit"
                                            iconClassName={classes.icon}
                                          />
              }
              {messagesNode}
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
                title="Bookmarks"
                to="/bookmarks"
                icon="Bookmarks"
                iconClassName={classes.icon}
              />}
              {false}
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

