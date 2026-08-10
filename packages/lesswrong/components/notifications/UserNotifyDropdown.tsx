import React, { useCallback, useRef, useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { userHasSubscribeTabFeed } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import type { Placement as PopperPlacementType } from "popper.js"
import PopperCard from "../common/PopperCard";
import LWClickAwayListener from "../common/LWClickAwayListener";
import DropdownMenu from "../dropdowns/DropdownMenu";
import NotifyMeToggleDropdownItem from "../dropdowns/NotifyMeToggleDropdownItem";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('UserNotifyDropdown', (theme: ThemeType) => ({
  dropdownWrapper: {
    marginTop: 6,
  },
  dropdown: {
    width: 220,
    maxWidth: "100vw",
  },
}));

/**
 * Displays a "Get notified" button that lets the user subscribe to be notified
 * when the given user has published a new post or a new comment.
 * Currently only used in the FriendlyUsersProfile.
 */
const UserNotifyDropdown = ({user, popperPlacement="bottom-start", className}: {
  user: UsersProfile,
  popperPlacement?: PopperPlacementType,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();

  const currentUser = useCurrentUser();

  const handleSetOpen = useCallback((open: boolean) => {
    captureEvent("subscribeClick", {open, itemType: "user", userId: user._id});
    setIsOpen(open);
  }, [user._id, captureEvent]);

  return (
    <div className={className}>
      <div ref={anchorEl}>
        <div>
          <a onClick={() => handleSetOpen(!isOpen)}>
            Subscribe
          </a>
        </div>
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
              useCheckboxIcon
              subscriptionType="newActivityForFeed"
            />}
            <NotifyMeToggleDropdownItem
              document={user}
              title="Notify on posts"
              useCheckboxIcon
              subscriptionType="newPosts"
            />
            <NotifyMeToggleDropdownItem
              document={user}
              title="Notify on comments"
              useCheckboxIcon
              subscriptionType="newUserComments"
            />
          </DropdownMenu>
        </LWClickAwayListener>
      </PopperCard>
    </div>
  );
}

export default UserNotifyDropdown


