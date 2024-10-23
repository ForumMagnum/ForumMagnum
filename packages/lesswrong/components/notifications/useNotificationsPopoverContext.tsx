import React, { createContext, useCallback, useContext } from 'react';
import { Link, LinkProps } from '../../lib/reactRouterWrapper';

export const NotificationsPopoverContext = createContext<{ closeNotifications: () => void }>({
  closeNotifications: () => {},
});

export const useNotificationsPopoverContext = () => {
  return useContext(NotificationsPopoverContext);
};

/**
 * Wrapper for `<Link>` that closes the notification popover when a link is clicked.
 * Safe to err on the side of using because it will only close if the link is within
 * the `NotificationsPopoverContext`.
 */
export const NotifPopoverLink= ({...props}: LinkProps) => {
  const { closeNotifications } = useNotificationsPopoverContext();

  const { onClick } = props;

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    closeNotifications();
  }, [onClick, closeNotifications]);

  return (
    <Link {...props} onClick={handleClick} />
  );
};
