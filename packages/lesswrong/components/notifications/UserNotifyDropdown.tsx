import React, { useCallback, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from '../../lib/analyticsEvents';
import classNames from 'classnames';

const styles = (_theme: ThemeType) => ({
  buttonContent: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  buttonIcon: {
    width: 17,
    height: 17,
  },
  chevron: {
    marginLeft: 4,
  },
  dropdown: {
    width: 200,
    maxWidth: "100vw",
  },
});

const UserNotifyDropdown = ({
  user,
  classes,
}: {
  user: UsersProfile,
  classes: ClassesType<typeof styles>,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();

  const handleSetOpen = useCallback((open: boolean) => {
    captureEvent("subscribeClick", {open, itemType: "user", userId: user._id});
    setIsOpen(open);
  }, [user._id, captureEvent]);

  const {
    EAButton, ForumIcon, PopperCard, LWClickAwayListener, DropdownMenu,
    NotifyMeToggleDropdownItem,
  } = Components;
  return (
    <div>
      <div ref={anchorEl}>
        <EAButton
          style="grey"
          onClick={() => handleSetOpen(!isOpen)}
        >
          <span className={classes.buttonContent}>
            <ForumIcon icon="BellBorder" className={classes.buttonIcon} />
            Get notified
            <ForumIcon
              icon="ThickChevronDown"
              className={classNames(classes.buttonIcon, classes.chevron)}
            />
          </span>
        </EAButton>
      </div>
      <PopperCard
        open={isOpen}
        anchorEl={anchorEl.current}
        placement="bottom-start"
      >
        <LWClickAwayListener onClickAway={() => handleSetOpen(false)}>
          <DropdownMenu className={classes.dropdown}>
            <NotifyMeToggleDropdownItem
              document={user}
              title="New posts"
              subscriptionType="newPosts"
            />
            <NotifyMeToggleDropdownItem
              document={user}
              title="New comments"
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
