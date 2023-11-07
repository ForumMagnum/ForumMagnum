import React, { useContext, createContext } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useHover } from '../common/withHover'
import classNames from 'classnames';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import type { PopperPlacementType } from '@material-ui/core/Popper'

const styles = (theme: ThemeType): JssStyles => ({
  color: {
    color: theme.palette.primary.main,
  },
  noColor: {
    color: "inherit !important"
  },
});

type DisableNoKibitzContextType = {disableNoKibitz: boolean, setDisableNoKibitz: (disableNoKibitz: boolean)=>void};
export const DisableNoKibitzContext = createContext<DisableNoKibitzContextType >({disableNoKibitz: false, setDisableNoKibitz: ()=>{}});

/**
 * Given a user (which may not be null), render the user name as a link with a
 * tooltip. This should not be used directly; use UsersName instead.
 */
const UsersNameDisplay = ({
  user,
  color=false,
  nofollow=false,
  simple=false,
  classes,
  showTooltip=true,
  tooltipPlacement="left",
  pageSectionContext,
  className,
}: {
  user: UsersMinimumInfo|null|undefined,
  color?: boolean,
  nofollow?: boolean,
  simple?: boolean,
  classes: ClassesType,
  showTooltip?: boolean,
  tooltipPlacement?: PopperPlacementType,
  pageSectionContext?: string,
  className?: string,
}) => {
  const {eventHandlers, hover} = useHover({pageElementContext: "linkPreview",  pageSubElementContext: "userNameDisplay", userId: user?._id})
  const currentUser = useCurrentUser();
  const {disableNoKibitz} = useContext(DisableNoKibitzContext);
  const noKibitz = (currentUser
    && (currentUser.noKibitz ?? false)
    && user
    && currentUser._id !== user._id  //don't nokibitz your own name
    && !disableNoKibitz
    && !hover
  );

  if (!user || user.deleted) {
    return <Components.UserNameDeleted userShownToAdmins={user}/>
  }
  const { UserTooltip } = Components

  const displayName = noKibitz ? "(hidden)" : userGetDisplayName(user);
  const colorClass = color?classes.color:classes.noColor;

  if (simple) {
    return <span {...eventHandlers} className={classNames(colorClass, className)}>
      {displayName}
    </span>
  }
  
  let profileUrl = userGetProfileUrl(user)
  if (pageSectionContext) {
    profileUrl += `?from=${pageSectionContext}`
  }

  return <span className={className}>
    <span {...eventHandlers}>
      <AnalyticsContext pageElementContext="userNameDisplay" userIdDisplayed={user._id}>
        <UserTooltip
          user={user}
          placement={tooltipPlacement}
          inlineBlock={false}
          showTooltip={showTooltip}
        >
          <Link to={profileUrl} className={colorClass}
            {...(nofollow ? {rel:"nofollow"} : {})}
          >
            {displayName}
          </Link>
        </UserTooltip>
      </AnalyticsContext>
    </span>
  </span>
}

const UsersNameDisplayComponent = registerComponent(
  'UsersNameDisplay', UsersNameDisplay, {styles}
);

declare global {
  interface ComponentTypes {
    UsersNameDisplay: typeof UsersNameDisplayComponent
  }
}
