import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import ErrorIcon from '@material-ui/icons/ErrorOutline';
import {
  userGetDisplayName,
  userGetProfileUrl,
} from '../../lib/collections/users/helpers';

const styles = (theme: ThemeType) => ({
  userName: {
    whiteSpace: "nowrap",
    color: theme.palette.text.secondary,
  },
  tooltipUserName: {
    fontWeight: "bold",
  },
  icon: {
    transform: "translateY(4px)",
  },
});

const UsersNamePending = ({ user, classes }: {
  user: UsersMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  const { LWTooltip } = Components;
  const name = userGetDisplayName(user)
  const tooltip = <p>
    <span className={classes.tooltipUserName}>{name}</span> has been requested
    as a co-author of this post. They can accept or decline this request.
  </p>;

  return (
    <LWTooltip title={tooltip} placement="right">
      <Link to={userGetProfileUrl(user)} className={classes.userName}>
        {name} <ErrorIcon fontSize="small" className={classes.icon} />
      </Link>
    </LWTooltip>
  );
}

const UsersNamePendingComponent = registerComponent(
  'UsersNamePending', UsersNamePending, {styles}
);

declare global {
  interface ComponentTypes {
    UsersNamePending: typeof UsersNamePendingComponent
  }
}
