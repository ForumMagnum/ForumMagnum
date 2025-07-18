import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import ErrorIcon from '@/lib/vendor/@material-ui/icons/src/ErrorOutline';
import {
  userGetDisplayName,
  userGetProfileUrl,
} from '../../lib/collections/users/helpers';
import LWTooltip from "../common/LWTooltip";

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
    fontSize: 20,
  },
});

const UsersNamePending = ({ user, classes }: {
  user: UsersMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  const name = userGetDisplayName(user)
  const tooltip = <p>
    <span className={classes.tooltipUserName}>{name}</span> has been requested
    as a co-author of this post. They can accept or decline this request.
  </p>;

  return (
    <LWTooltip title={tooltip} placement="right">
      <Link to={userGetProfileUrl(user)} className={classes.userName}>
        {name} <ErrorIcon className={classes.icon} />
      </Link>
    </LWTooltip>
  );
}

export default registerComponent(
  'UsersNamePending', UsersNamePending, {styles}
);


