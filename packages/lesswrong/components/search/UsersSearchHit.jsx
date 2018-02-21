import { Components, registerComponent} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import moment from 'moment';
import { Link } from 'react-router';
import React, { PureComponent } from 'react';

const isLeftClick = (event) => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const UsersSearchHit = ({hit, clickAction}) => <div className="search-results-users-item users-item">
  <Link
    to={Users.getProfileUrl(hit)}
    onClick={(event) => isLeftClick(event) && clickAction()}
  >
      <div className="users-item-body ">
        <div className="users-item-name">
          {hit.displayName}
        </div>
        <div className="users-item-meta">
          <div className="users-item-karma">{hit.karma} points </div>
          <div className="users-item-created-date"> {moment(new Date(hit.createdAt)).fromNow()}</div>
        </div>
      </div>
    </Link>
</div>

registerComponent("UsersSearchHit", UsersSearchHit);
