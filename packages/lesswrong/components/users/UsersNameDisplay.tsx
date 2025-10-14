import React from 'react';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useHover } from '../common/withHover'
import classNames from 'classnames';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { Placement as PopperPlacementType } from "popper.js"
import UserNameDeleted from "./UserNameDeleted";
import UserTooltip from "./UserTooltip";
import { useNoKibitz } from '../hooks/useNoKibitz';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("UsersNameDisplay", (theme: ThemeType) => ({
  color: {
    color: theme.palette.primary.main,
  },
  noColor: {
    color: `inherit !important`
  },
  noKibitz: {
    minWidth: 55,
  },
  nowrap: {
    whiteSpace: "nowrap"
  },
}));

/**
 * Given a user (which may not be null), render the user name as a link with a
 * tooltip. This should not be used directly; use UsersName instead.
 */
const UsersNameDisplay = ({
  user,
  color=false,
  nofollow=false,
  simple=false,
  nowrap=false,
  noTooltip=false,
  hideFollowButton=false,
  tooltipPlacement="left",
  pageSectionContext,
  className,
}: {
  /** The user whose name to show. If nullish, will show as "[anonymous]". */
  user: UsersMinimumInfo|null|undefined,
  /** If the name is in the site primary color */
  color?: boolean,
  /** If the name is a link, it's marked nofollow */
  nofollow?: boolean,
  /** If set, the tooltip is not shown though otherwise is a link */
  noTooltip?: boolean,
  /** The name is only text, not a link, and doesn't have a hover */
  simple?: boolean,
  /** If set, usernames with spaces are not allowed to wrap. Default false. */
  nowrap?: boolean,
  /** If set, the follow button is hidden (relevant to LWTooltip. */
  hideFollowButton?: boolean,
  /** Positioning of the tooltip, if there is one */
  tooltipPlacement?: PopperPlacementType,
  /** If provided, a tracking string added to the link */
  pageSectionContext?: string,
  /** An additional class to apply to the text */
  className?: string,
}) => {
  const classes = useStyles(styles);
  const {eventHandlers, hover} = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      pageSubElementContext: "userNameDisplay",
      userId: user?._id
    },
  });
  const noKibitz = useNoKibitz(user);
  const nameHidden = noKibitz && !hover;

  if (!user || user.deleted) {
    return <UserNameDeleted userShownToAdmins={user}/>
  }
  const displayName = nameHidden ? "(hidden)" : userGetDisplayName(user);
  const colorClass = color?classes.color:classes.noColor;

  if (simple) {
    return <span
      {...eventHandlers}
      className={classNames(
        colorClass, className,
        noKibitz && classes.noKibitz
      )}
    >
      {displayName}
    </span>
  }
  
  let profileUrl = userGetProfileUrl(user)
  if (pageSectionContext) {
    profileUrl += `?from=${pageSectionContext}`
  }

  return <span className={className} {...eventHandlers}>
    <AnalyticsContext pageElementContext="userNameDisplay" userIdDisplayed={user._id}>
      <UserTooltip
        user={user}
        placement={tooltipPlacement}
        inlineBlock={false}
        hideFollowButton={hideFollowButton}
        disabled={noTooltip}
      >
        <Link
          to={profileUrl}
          className={classNames(
            colorClass,
            noKibitz && classes.noKibitz,
            nowrap && classes.nowrap,
          )}
          {...(nofollow ? {rel:"nofollow"} : {})}
        >
          {displayName}
        </Link>
      </UserTooltip>
    </AnalyticsContext>
  </span>
}

export default UsersNameDisplay;
