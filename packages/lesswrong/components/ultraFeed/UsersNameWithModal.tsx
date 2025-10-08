import React from 'react';
import UsersName from '../users/UsersName';
import UltraFeedUserCard from '../ultraFeed/UltraFeedUserCard';
import UltraFeedUserDialog from './UltraFeedUserDialog';
import HoverOver from '../common/HoverOver';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import type { Placement as PopperPlacementType } from "popper.js";
import UserNameDeleted from '../users/UserNameDeleted';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useDialog } from '../common/withDialog';
import { useUltraFeedContext } from './UltraFeedContextProvider';
import SubscriptionsIcon from '@/lib/vendor/@material-ui/icons/src/NotificationsNone';
import { useNoKibitz } from '../hooks/useNoKibitz';
import { useHover } from '../common/withHover';

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
  const { captureEvent } = useTracking();
  const { openDialog } = useDialog();
  const { openInNewTab } = useUltraFeedContext();
  const noKibitz = useNoKibitz(user);
  const { eventHandlers, hover } = useHover();

  if (!user && !documentId) {
    return <UsersName user={user} documentId={documentId} {...otherProps} className={className} />;
  }

  if (!user && documentId) {
    return <UsersName documentId={documentId} {...otherProps} className={className} />;
  }

  if (!user || user.deleted) {
    return <UserNameDeleted />;
  }

  const nameHidden = noKibitz && !hover;
  const displayName = nameHidden ? "(hidden)" : userGetDisplayName(user);
  const profileUrl = userGetProfileUrl(user);

  if (simple) {
    return <span className={className}>
      {displayName}
      {showSubscribedIcon && <SubscriptionsIcon className={classes.subscribeIcon} />}
    </span>;
  }

  const handleClick = (e: React.MouseEvent) => {
    const hasModifier = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    
    if (hasModifier) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    if (openInNewTab) {
      captureEvent("ultraFeedUserOpenedInNewTab", { viewedUserId: user._id });
      window.open(profileUrl, '_blank');
    } else {
      captureEvent("ultraFeedUserDialogOpened", { viewedUserId: user._id });
      
      openDialog({
        name: "UltraFeedUserDialog",
        closeOnNavigate: true,
        contents: ({ onClose }) => (
          <UltraFeedUserDialog
            user={user}
            onClose={onClose}
          />
        )
      });
    }
  };

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
          onClick={handleClick}
          {...(nofollow ? { rel: "nofollow" } : {})}
        >
          <span {...eventHandlers}>{displayName}</span>
          {showSubscribedIcon && <SubscriptionsIcon className={classes.subscribeIcon} />}
        </Link>
      </HoverOver>
    </AnalyticsContext>
  );
};

export default UsersNameWithModal;

