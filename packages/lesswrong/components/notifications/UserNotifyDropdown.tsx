import React, { useCallback, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from '../../lib/analyticsEvents';
import { userHasSubscribeTabFeed } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { PopperPlacementType } from '@/lib/vendor/@material-ui/core/src/Popper/Popper';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (_theme: ThemeType) => ({
  buttonContent: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  buttonIcon: {
    width: 16,
    height: 16,
  },
  dropdownWrapper: {
    marginTop: 6,
  },
  dropdown: {
    width: isFriendlyUI ? 200 : 220,
    maxWidth: "100vw",
  },
});

/**
 * Displays a "Get notified" button that lets the user subscribe to be notified
 * when the given user has published a new post or a new comment.
 * Currently only used in the FriendlyUsersProfile.
 */
const UserNotifyDropdown = ({
  user,
  popperPlacement="bottom-start",
  className,
  classes,
}: {
  user: UsersProfile,
  popperPlacement?: PopperPlacementType,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();

  const currentUser = useCurrentUser();

  const handleSetOpen = useCallback((open: boolean) => {
    captureEvent("subscribeClick", {open, itemType: "user", userId: user._id});
    setIsOpen(open);
  }, [user._id, captureEvent]);

  const {
    EAButton, ForumIcon, PopperCard, LWClickAwayListener, DropdownMenu,
    NotifyMeToggleDropdownItem,
  } = Components;

  const ButtonComponent = isFriendlyUI 
    ?  <EAButton
          style="grey"
          onClick={() => handleSetOpen(!isOpen)}
        >
          <span className={classes.buttonContent}>
            <ForumIcon icon="BellBorder" className={classes.buttonIcon} />
            Get notified
            <ForumIcon
              icon="ThickChevronDown"
              className={classes.buttonIcon}
            />
          </span>
        </EAButton>
    : <div>
        <a onClick={() => handleSetOpen(!isOpen)}>
          Subscribe
        </a>
    </div>
  

  return (
    <div className={className}>
      <div ref={anchorEl}>
        {ButtonComponent}
      </div>
      <PopperCard
        open={isOpen}
        anchorEl={anchorEl.current}
        placement={popperPlacement}
        className={classes.dropdownWrapper}
      >
        <LWClickAwayListener onClickAway={() => handleSetOpen(false)}>
          <DropdownMenu className={classes.dropdown}>
            {userHasSubscribeTabFeed(currentUser) && <NotifyMeToggleDropdownItem
              document={user}
              title="Include in Subscribed tab"
              useCheckboxIcon={!isFriendlyUI}
              subscriptionType="newActivityForFeed"
            />}
            <NotifyMeToggleDropdownItem
              document={user}
              title={isFriendlyUI ? "New posts" : "Notify on posts"}
              useCheckboxIcon={!isFriendlyUI}
              subscriptionType="newPosts"
            />
            <NotifyMeToggleDropdownItem
              document={user}
              title={isFriendlyUI ? "New comments" : "Notify on comments"}
              useCheckboxIcon={!isFriendlyUI}
              subscriptionType="newUserComments"
            />
          </DropdownMenu>
        </LWClickAwayListener>
      </PopperCard>
    </div>
  );
}

const UserNotifyDropdownComponent = registerComponent('UserNotifyDropdown', UserNotifyDropdown, {styles});

declare global {
  interface ComponentTypes {
    UserNotifyDropdown: typeof UserNotifyDropdownComponent
  }
}
