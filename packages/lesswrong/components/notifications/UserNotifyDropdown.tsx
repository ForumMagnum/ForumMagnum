import type { Placement as PopperPlacementType } from "popper.js";
import { useCallback, useRef, useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { userHasSubscribeTabFeed } from '../../lib/betas';
import { registerComponent } from '../../lib/vulcan-lib/components';
import LWClickAwayListener from "../common/LWClickAwayListener";
import PopperCard from "../common/PopperCard";
import { useCurrentUser } from '../common/withUser';
import DropdownMenu from "../dropdowns/DropdownMenu";
import NotifyMeToggleDropdownItem from "../dropdowns/NotifyMeToggleDropdownItem";

const styles = (theme: ThemeType) => ({
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
    width: 220,
    maxWidth: "100vw",
  },
});

/**
 * Displays a "Get notified" button that lets the user subscribe to be notified
 * when the given user has published a new post or a new comment.
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
  const ButtonComponent = <div>
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
              useCheckboxIcon={true}
              subscriptionType="newActivityForFeed"
            />}
            <NotifyMeToggleDropdownItem
              document={user}
              title={"Notify on posts"}
              useCheckboxIcon={true}
              subscriptionType="newPosts"
            />
            <NotifyMeToggleDropdownItem
              document={user}
              title={"Notify on comments"}
              useCheckboxIcon={true}
              subscriptionType="newUserComments"
            />
          </DropdownMenu>
        </LWClickAwayListener>
      </PopperCard>
    </div>
  );
}

export default registerComponent('UserNotifyDropdown', UserNotifyDropdown, {styles});

