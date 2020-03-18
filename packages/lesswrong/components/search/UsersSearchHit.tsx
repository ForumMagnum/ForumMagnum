import { Components, registerComponent } from '../../lib/vulcan-lib';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import React from 'react';

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
})

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const UsersSearchHit = ({hit, clickAction, classes}) => <div className={classes.root}>
  <Link to={Users.getProfileUrl(hit)} onClick={(event) => isLeftClick(event) && clickAction()}>
    <Components.MetaInfo>
      <Components.FormatDate date={hit.createdAt}/>
    </Components.MetaInfo>
    <Components.MetaInfo>
      {hit.displayName}
    </Components.MetaInfo>
    <Components.MetaInfo>
      {hit.karma} points
    </Components.MetaInfo>
  </Link>
</div>

const UsersSearchHitComponent = registerComponent("UsersSearchHit", UsersSearchHit, {styles});

declare global {
  interface ComponentTypes {
    UsersSearchHit: typeof UsersSearchHitComponent
  }
}

