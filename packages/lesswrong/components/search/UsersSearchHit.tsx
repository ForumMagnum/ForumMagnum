import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft: theme.spacing.unit,
    marginTop: theme.spacing.unit/2,
    marginBottom: theme.spacing.unit/2
  },
})

const isLeftClick = (event: MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const UsersSearchHit = ({hit, clickAction, classes}: {
  hit: Hit<any>,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const user = hit as AlgoliaUser;
  return <div className={classes.root}>
    <Link to={userGetProfileUrl(user)} onClick={(event: MouseEvent) => isLeftClick(event) && clickAction && clickAction()}>
      <Components.MetaInfo>
        <Components.FormatDate date={user.createdAt}/>
      </Components.MetaInfo>
      <Components.MetaInfo>
        {user.displayName}
      </Components.MetaInfo>
      <Components.MetaInfo>
        {user.karma||0} points
      </Components.MetaInfo>
    </Link>
  </div>
}

const UsersSearchHitComponent = registerComponent("UsersSearchHit", UsersSearchHit, {styles});

declare global {
  interface ComponentTypes {
    UsersSearchHit: typeof UsersSearchHitComponent
  }
}

