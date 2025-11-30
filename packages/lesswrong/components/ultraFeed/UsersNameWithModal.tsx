import React from 'react';
import classNames from 'classnames';
import UsersName from '../users/UsersName';
import UltraFeedUserCard from '../ultraFeed/UltraFeedUserCard';
import HoverOver from '../common/HoverOver';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import type { Placement as PopperPlacementType } from "popper.js";
import UserNameDeleted from '../users/UserNameDeleted';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SubscriptionsIcon from '@/lib/vendor/@material-ui/icons/src/NotificationsNone';
import { useHover } from '../common/withHover';
import { useNoKibitz } from '../hooks/useNoKibitz';

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
  noKibitz: {
    minWidth: 55,
  },
}));

/**
 * A username component introduced for the UltraFeed, originally so that a modal was opened upon click.
 * Currently, the difference is in tooltip/hover shown.
 * TODO: Reconcile with existing UsersName component.
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
  const {eventHandlers, hover} = useHover({
    eventProps: {
      pageSubElementContext: "ultraFeedUserName",
      userId: user?._id
    },
  });
  const noKibitz = useNoKibitz(user);
  const nameHidden = noKibitz && !hover;

  if (!user && !documentId) {
    return <UsersName user={user} documentId={documentId} {...otherProps} className={className} />;
  }

  if (!user && documentId) {
    return <UsersName documentId={documentId} {...otherProps} className={className} />;
  }

  if (!user || user.deleted) {
    return <UserNameDeleted />;
  }

  const displayName = nameHidden ? "(hidden)" : userGetDisplayName(user);
  const profileUrl = userGetProfileUrl(user);

  if (simple) {
    return (
      <span {...eventHandlers} className={classNames(className, noKibitz && classes.noKibitz)} >
        {displayName}
        {showSubscribedIcon && <SubscriptionsIcon className={classes.subscribeIcon} />}
      </span>
    );
  }

  return (
    <AnalyticsContext pageElementContext="ultraFeedUserName" userIdDisplayed={user._id}>
      <span {...eventHandlers}>
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
            className={classNames(className, noKibitz && classes.noKibitz)}
            {...(nofollow ? { rel: "nofollow" } : {})}
          >
            {displayName}
            {showSubscribedIcon && <SubscriptionsIcon className={classes.subscribeIcon} />}
          </Link>
        </HoverOver>
      </span>
    </AnalyticsContext>
  );
};

export default UsersNameWithModal;

