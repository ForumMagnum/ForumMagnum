import React from 'react';
import UsersName from '../users/UsersName';
import UltraFeedUserCard from '../ultraFeed/UltraFeedUserCard';
import HoverOver from '../common/HoverOver';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import type { Placement as PopperPlacementType } from "popper.js";
import UserNameDeleted from '../users/UserNameDeleted';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SubscriptionsIcon from '@/lib/vendor/@material-ui/icons/src/NotificationsNone';

const styles = defineStyles("UsersNameWithModal", (theme: ThemeType) => ({
  subscribeIcon: {
    width: 15,
    height: 15,
    color: theme.palette.grey[600],
    position: 'relative',
    top: 3,
    marginLeft: 3,
  },
  cardWrapper: {
    padding: 0,
    background: "unset",
    maxWidth: "none",
  },
}));

/**
 * A username component specifically for UltraFeed that shows an enhanced card on hover (desktop)
 * or opens a modal dialog (mobile) when clicked.
 */
const UsersNameWithModal = ({
  user,
  documentId,
  nofollow = false,
  tooltipPlacement = "bottom-start",
  className,
  simple = false,
  showSubscribedIcon = false,
  ...otherProps
}: {
  user?: UsersMinimumInfo | null | undefined;
  documentId?: string;
  nofollow?: boolean;
  tooltipPlacement?: PopperPlacementType;
  className?: string;
  simple?: boolean;
  showSubscribedIcon?: boolean;
  color?: boolean;
  pageSectionContext?: string;
}) => {
  const classes = useStyles(styles);

  if (!user && !documentId) {
    return <UsersName user={user} documentId={documentId} {...otherProps} className={className} />;
  }

  if (!user && documentId) {
    return <UsersName documentId={documentId} {...otherProps} className={className} />;
  }

  if (!user || user.deleted) {
    return <UserNameDeleted />;
  }

  const displayName = userGetDisplayName(user);
  const profileUrl = userGetProfileUrl(user);

  if (simple) {
    return <span className={className}>
      {displayName}
      {showSubscribedIcon && <SubscriptionsIcon className={classes.subscribeIcon} />}
    </span>;
  }


  return (
    <AnalyticsContext pageElementContext="ultraFeedUserName" userIdDisplayed={user._id}>
      <HoverOver
        title={<UltraFeedUserCard user={user} />}
        placement={tooltipPlacement}
        clickable
        disabledOnMobile
        flip
        popperClassName={classes.cardWrapper}
      >
        <Link
          to={profileUrl}
          className={className}
          {...(nofollow ? { rel: "nofollow" } : {})}
        >
          {displayName}
          {showSubscribedIcon && <SubscriptionsIcon className={classes.subscribeIcon} />}
        </Link>
      </HoverOver>
    </AnalyticsContext>
  );
};

export default UsersNameWithModal;

