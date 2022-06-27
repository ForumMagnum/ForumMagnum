import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import ErrorIcon from '@material-ui/icons/ErrorOutline';
import {
  userGetDisplayName,
  userGetProfileUrl,
} from '../../lib/collections/users/helpers';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
}) => {
  const { LWTooltip } = Components;
  const name = userGetDisplayName(user)
  const tooltip = <p>
    You have requested <span className={classes.tooltipUserName}>{name}</span> to
    co-author this post. They can accept or decline this request.
  </p>;

  return (
    <span>
      <LWTooltip title={tooltip} placement="right" inlineBlock={false}>
        <Link to={userGetProfileUrl(user)} className={classes.userName}>
          {name} <ErrorIcon fontSize="small" className={classes.icon} />
        </Link>
      </LWTooltip>
    </span>
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
