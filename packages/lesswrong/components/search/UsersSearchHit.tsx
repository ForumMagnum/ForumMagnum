import { registerComponent } from '../../lib/vulcan-lib/components';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import PersonIcon from '@/lib/vendor/@material-ui/icons/src/Person';
import React from 'react';
import type { SearchHitComponentProps } from './types';
import LWTooltip from "../common/LWTooltip";
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 10,
    paddingTop: 2,
    paddingBottom: 2,
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    width: 20,
    color: theme.palette.grey[500],
    marginRight: 12,
    marginLeft: 4
  }
})

export const isLeftClick = (event: React.MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const UsersSearchHit = ({hit, clickAction, classes, showIcon=false}: SearchHitComponentProps) => {
  const user = hit as SearchUser

  return <div className={classes.root}>
    {showIcon && <LWTooltip title="User">
      <PersonIcon className={classes.icon} />
    </LWTooltip>}
    <Link to={`${userGetProfileUrl(user)}?from=search_autocomplete`} onClick={(event: React.MouseEvent) => isLeftClick(event) && clickAction && clickAction()}>
      <MetaInfo>
        {user.displayName}
      </MetaInfo>
      <MetaInfo>
        <FormatDate date={user.createdAt} />
      </MetaInfo>
      <MetaInfo>
        {user.karma||0} karma
      </MetaInfo>
    </Link>
  </div>
}

export default registerComponent("UsersSearchHit", UsersSearchHit, {styles});


