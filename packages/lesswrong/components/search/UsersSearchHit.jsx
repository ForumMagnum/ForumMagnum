import { Components, registerComponent } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

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

registerComponent("UsersSearchHit", UsersSearchHit, withStyles(styles, { name: "UsersSearchHit" }));
