import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { userGetDisplayName, userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';

/**
 * Username for a deleted user. Ordinarily, looks like "[anonymous]" and
 * provides no info about the user. However, if a nonnull `userShownToMods` is
 * provided and the current user is an admin, then this will reveal the name on
 * hover-over and work as a link.
 */
const UserNameDeleted = ({userShownToAdmins}: {
  userShownToAdmins?: UsersMinimumInfo|null
}) => {
  if (userShownToAdmins) {
    return <UserNameDeletedWithAdminHover user={userShownToAdmins}/>
  }
  return <Components.LWTooltip title={<div>
    <div>Author has deactivated their account,</div>
    <div>or is no longer associated with this post.</div>
  </div>}>
    [anonymous]
  </Components.LWTooltip>
};

const UserNameDeletedWithAdminHover = ({user}: {
  user: UsersMinimumInfo
}) => {
  const {eventHandlers,hover} = useHover();
  const { LWTooltip } = Components;

  return <span {...eventHandlers}>
    <LWTooltip
      title={<div>
        This user account has been deleted. The username is only visible to site admins, and only visible on hover-over.
      </div> }
      inlineBlock={false}
    >
      {hover
        ? <Link to={userGetProfileUrl(user)}>
            {userGetDisplayName(user)}
          </Link>
        : "[anonymous]"
      }
    </LWTooltip>
  </span>
}

const UserNameDeletedComponent = registerComponent('UserNameDeleted', UserNameDeleted);

declare global {
  interface ComponentTypes {
    UserNameDeleted: typeof UserNameDeletedComponent
  }
}
